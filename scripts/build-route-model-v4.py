"""Erzeugt das Routenmodell v4 aus dem Referenzlauf vom 2026-09-08.

Grundlage ist der iPhone-Lauf jenes Tages: gueltig gewertet, vollstaendig,
1056 Punkte bei +/- 3 bis 4 m, und an jeder 100er-Marke ein Screenshot, dessen
Dateizeit die Laufsekunde verraet. Das liefert zwoelf exakte Paare aus Position
und echtem Stufenstand.

Zwei Dinge kommen gegenueber v3 dazu:

1. Die Hoehe stammt aus der parallel laufenden Strava-Aufzeichnung und ist
   barometrisch. Die GPS-Hoehe desselben Laufs sammelt ohne Schwelle 74 m
   Phantom-Anstieg an, die barometrische ist praktisch rauschfrei.
2. Die treppenlosen Abschnitte sind an ihrer gemessenen Stelle verankert statt
   an der aus dem Kalibriergang uebernommenen Stufenzahl. Genau dort lag der
   Fehler von v3: seine letzte Grenze bei Zaehlerstand 663 sitzt rund 30 Stufen
   zu hoch, was sich an der Marke 600 als +27,6 Stufen zeigte.

Die Stufen werden zwischen zwei Marken ueber die Treppendistanz verteilt --
also ueber die Strecke abzueglich der treppenlosen Zonen darin. Dadurch trifft
das Modell jede Marke exakt und laesst den Zaehler auf den Wegen stehen.
"""
import csv, json, math, re, sys
from datetime import datetime

R = 6371000.0
DATA = "/Users/seven4ever/.tusiger-data/testrun-08-09/testrun-iphone-08-09-26/"
GT = "test_runs/ground_truth_points.csv"
DP_EPSILON_M = 1.0
SMOOTH_WINDOW = 5


def hav(a, b):
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp = p2 - p1
    dl = math.radians(b["lng"] - a["lng"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def iso(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()


def load_run():
    run = json.load(open(DATA + "iphone-tusiger-run-01.json"))["run"]
    pts = [
        {"lat": p["lat"], "lng": p["lng"], "acc": p.get("accuracyM") or 99.0,
         "t": iso(p["recordedAt"])}
        for p in run["points"]
    ]
    pts.sort(key=lambda p: p["t"])
    return pts


def load_strava():
    txt = open(DATA + "iphone-strava-02-Lauf_am_Mittag.gpx").read()
    out = []
    for m in re.finditer(
        r'<trkpt lat="([-\d.]+)" lon="([-\d.]+)">\s*<ele>([-\d.]+)</ele>\s*<time>([^<]+)</time>', txt
    ):
        la, lo, el, t = m.groups()
        out.append({"lat": float(la), "lng": float(lo), "alt": float(el), "t": iso(t)})
    return out


def smooth(points, window):
    """Gleitender Mittelwert. Die Strecke ist eine Linie, das GPS wandert darum."""
    out = []
    half = window // 2
    for i in range(len(points)):
        lo, hi = max(0, i - half), min(len(points), i + half + 1)
        chunk = points[lo:hi]
        out.append({
            "lat": sum(p["lat"] for p in chunk) / len(chunk),
            "lng": sum(p["lng"] for p in chunk) / len(chunk),
            "t": points[i]["t"],
        })
    return out


def douglas_peucker(points, epsilon):
    """Liefert die Indizes der behaltenen Punkte."""
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    ref = points[0]
    cos_lat = math.cos(math.radians(ref["lat"]))

    def xy(p):
        return ((p["lng"] - ref["lng"]) * cos_lat * 111320.0,
                (p["lat"] - ref["lat"]) * 110540.0)

    XY = [xy(p) for p in points]

    def recurse(lo, hi):
        if hi <= lo + 1:
            return
        (x1, y1), (x2, y2) = XY[lo], XY[hi]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        worst, wi = -1.0, -1
        for i in range(lo + 1, hi):
            x, y = XY[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L if L > 0 else math.hypot(x - x1, y - y1)
            if d > worst:
                worst, wi = d, i
        if worst > epsilon:
            keep[wi] = True
            recurse(lo, wi)
            recurse(wi, hi)

    recurse(0, len(points) - 1)
    return [i for i, k in enumerate(keep) if k]


def main():
    raw = load_run()
    strava = load_strava()
    t0 = raw[0]["t"]

    track = smooth(raw, SMOOTH_WINDOW)
    cum = [0.0]
    for i in range(1, len(track)):
        cum.append(cum[-1] + hav(track[i - 1], track[i]))

    def index_at(elapsed):
        target = t0 + elapsed
        return min(range(len(track)), key=lambda i: abs(track[i]["t"] - target))

    def dist_at(elapsed):
        return cum[index_at(elapsed)]

    # --- Marken und Zonen aus der Ground Truth (nur iPhone, nur Runde 1)
    gt = [r for r in csv.DictReader(open(GT)) if r["device"] == "iphone"]
    marks = sorted(
        [(int(r["stairs_value"]), float(r["elapsed_s"]))
         for r in gt if r["position_type"] == "stairs_mark"]
    )
    starts = {int(r["stairs_value"]): float(r["elapsed_s"])
              for r in gt if r["position_type"] == "no_stairs_start"}
    stops = {int(r["stairs_value"]): float(r["elapsed_s"])
             for r in gt if r["position_type"] == "no_stairs_stop"}
    zones = [(dist_at(starts[k]), dist_at(stops[k])) for k in sorted(starts) if k in stops]

    # Anker: Startpunkt bei 0 Stufen, dann die zwoelf fotografierten Marken.
    anchors = [(0.0, 0.0)] + [(dist_at(sec), float(st)) for st, sec in marks]

    def build(zone_list):
        """steps(distance) als stueckweise lineare Funktion ueber die Anker."""
        segs = []
        for (da, sa), (db, sb) in zip(anchors, anchors[1:]):
            inner = [(max(z0, da), min(z1, db)) for z0, z1 in zone_list
                     if z1 > da and z0 < db]
            inner = [(a, b) for a, b in inner if b > a]
            flat = sum(b - a for a, b in inner)
            stair_dist = (db - da) - flat
            if stair_dist <= 0:            # Zonen fuellen das Intervall: linear
                inner, flat, stair_dist = [], 0.0, db - da
            rate = (sb - sa) / stair_dist if stair_dist > 0 else 0.0
            segs.append({"d0": da, "d1": db, "s0": sa, "zones": sorted(inner), "rate": rate})

        def steps_at(d):
            if d <= anchors[0][0]:
                return anchors[0][1]
            if d >= anchors[-1][0]:
                return anchors[-1][1]
            seg = next(s for s in segs if s["d0"] <= d <= s["d1"])
            s = seg["s0"]
            cursor = seg["d0"]
            for z0, z1 in seg["zones"]:
                if d <= z0:
                    break
                s += (z0 - cursor) * seg["rate"]
                cursor = min(d, z1)
                if d <= z1:
                    return s
                cursor = z1
            return s + (d - cursor) * seg["rate"]

        return steps_at

    # Pass 1 ohne die auf dem iPhone vergessene Zone, Pass 2 mit ihr.
    # Das Android lief dieselbe Strecke und hat sie bei Stufenstand 261..267
    # aufgezeichnet; hier wird sie an genau dieser Stelle eingesetzt.
    p1 = build(zones)
    lo, hi = anchors[0][0], anchors[-1][0]

    def dist_for_steps(target):
        a, b = lo, hi
        for _ in range(60):
            m = (a + b) / 2
            if p1(m) < target:
                a = m
            else:
                b = m
        return (a + b) / 2

    missing = (dist_for_steps(261.0), dist_for_steps(267.0))
    all_zones = sorted(zones + [missing])
    steps_at = build(all_zones)

    # --- Stuetzpunkte
    kept = set(douglas_peucker(track, DP_EPSILON_M))
    end_index = index_at(marks[-1][1])          # Position bei Stufe 1150
    kept.add(end_index)

    # Die Zonengrenzen und die fotografierten Marken muessen eigene Stuetzpunkte
    # bekommen. Zwischen zwei Stuetzpunkten interpoliert die Laufzeit linear --
    # eine sechs Meter lange treppenlose Zone, die ganz in ein zehn Meter langes
    # Segment faellt, waere sonst wieder weginterpoliert und der Zaehler liefe
    # dort weiter.
    def nearest_index(distance):
        return min(range(len(cum)), key=lambda i: abs(cum[i] - distance))

    for z0, z1 in all_zones:
        kept.add(nearest_index(z0))
        kept.add(nearest_index(z1))
    for _, sec in marks:
        kept.add(index_at(sec))
    kept = sorted(kept)

    def alt_at(t):
        c = min(strava, key=lambda p: abs(p["t"] - t))
        return c["alt"] if abs(c["t"] - t) <= 3 else None

    waypoints = []
    for i in kept:
        s = min(steps_at(cum[i]), 1150.0)
        if i >= end_index:
            s = 1150.0                          # oben angekommen bleibt es 1150
        a = alt_at(track[i]["t"])
        if a is None:
            a = waypoints[-1]["altM"] if waypoints else 429.8
        waypoints.append({
            # Ganze Stufen: das Modell trifft auf rund vier Stufen genau, eine
            # Zehntelaufloesung waere vorgetaeuschte Praezision. Anker und
            # Zonengrenzen bleiben dabei exakt, weil sie ganzzahlig liegen
            # bzw. an beiden Enden denselben Wert tragen.
            "steps": round(s),
            "lat": round(track[i]["lat"], 7),
            "lng": round(track[i]["lng"], 7),
            "altM": round(a, 1),
        })

    # Monotonie erzwingen (Rundung kann winzige Rueckschritte erzeugen)
    for i in range(1, len(waypoints)):
        if waypoints[i]["steps"] < waypoints[i - 1]["steps"]:
            waypoints[i]["steps"] = waypoints[i - 1]["steps"]
    waypoints[0]["steps"] = 0.0
    waypoints[-1]["steps"] = 1150.0

    # --- Abschnitte: Stufenstaende der Zonengrenzen
    sections = []
    cursor = 0.0
    for z0, z1 in all_zones:
        a, b = steps_at(z0), steps_at(z1)
        sections.append({"kind": "stairs", "fromSteps": round(cursor), "toSteps": round(a)})
        sections.append({"kind": "path", "fromSteps": round(a), "toSteps": round(b)})
        cursor = b
    sections.append({"kind": "stairs", "fromSteps": round(cursor), "toSteps": 1150})

    out = {"waypoints": waypoints, "sections": sections,
           "zones": [(round(a, 1), round(b, 1)) for a, b in all_zones],
           "anchors": [(round(d, 1), s) for d, s in anchors]}
    json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else "/dev/stdout", "w"), indent=1)
    print(f"\n{len(waypoints)} Stuetzpunkte, {len(all_zones)} treppenlose Zonen", file=sys.stderr)
    print("Abschnitte:", file=sys.stderr)
    for s in sections:
        print(f"   {s['kind']:6s} {s['fromSteps']:5d} -> {s['toSteps']:5d}", file=sys.stderr)


main()
