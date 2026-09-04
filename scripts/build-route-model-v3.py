"""Erzeugt das Routenmodell v3 aus einem Kalibriergang.

Eingabe: marks- und track-CSV von zwei Geraeten, die den Gang gleichzeitig
aufgezeichnet haben. Die Marken beider Geraete beschreiben dieselben physischen
Punkte und werden gemittelt, weil jedes Geraet einen eigenen GPS-Bias von
mehreren Metern hat.

Ausgabe: routeWaypoints fuer src/data/challenge.ts. Treppenabschnitte verteilen
ihre Stufen ueber ihre eigene Distanz, stufenlose Abschnitte bekommen an beiden
Enden denselben Stufenwert - dadurch steht der Zaehler dort still.
"""
import csv, math, sys

R = 6371000.0

def hav(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = math.radians(b[0] - a[0]); dl = math.radians(b[1] - a[1])
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(h))

def load_marks(path):
    out = []
    for r in csv.DictReader(open(path)):
        out.append({
            "kind": r["kind"],
            "cum": int(r["cumulative_steps"]) if r["cumulative_steps"] else None,
            "sec": int(r["section_steps"]) if r["section_steps"] else None,
            "ms": int(r["timestamp_ms"]),
            "lat": float(r["lat"]), "lng": float(r["lng"]),
            "alt": float(r["altitude_m"]) if r["altitude_m"] else None,
        })
    return out

def load_track(path):
    out = []
    for r in csv.DictReader(open(path)):
        if not r["lat"]:
            continue
        out.append({
            "ms": int(r["timestamp_ms"]),
            "lat": float(r["lat"]), "lng": float(r["lng"]),
            "alt": float(r["altitude_m"]) if r["altitude_m"] else None,
            "acc": float(r["accuracy_m"]) if r["accuracy_m"] else 99.0,
        })
    return out

def resample(points, n):
    """Punkte gleichmaessig ueber die zurueckgelegte Strecke verteilen."""
    if len(points) < 2:
        return [points[0]] * n if points else []
    cum = [0.0]
    for a, b in zip(points, points[1:]):
        cum.append(cum[-1] + hav((a["lat"], a["lng"]), (b["lat"], b["lng"])))
    total = cum[-1]
    if total <= 0:
        return [points[0]] * n
    out = []
    for i in range(n):
        target = total * i / max(1, n - 1)
        j = 0
        while j < len(cum) - 2 and cum[j + 1] < target:
            j += 1
        span = cum[j + 1] - cum[j]
        t = 0.0 if span <= 0 else (target - cum[j]) / span
        a, b = points[j], points[j + 1]
        out.append({
            "lat": a["lat"] + (b["lat"] - a["lat"]) * t,
            "lng": a["lng"] + (b["lng"] - a["lng"]) * t,
            "alt": None if a["alt"] is None or b["alt"] is None else a["alt"] + (b["alt"] - a["alt"]) * t,
        })
    return out

def segment_points(track, from_ms, to_ms):
    inner = [p for p in track if from_ms <= p["ms"] <= to_ms and p["acc"] <= 25]
    return inner

MAX_STEPS_PER_M = 3.5
BOUNDARIES_ONLY = "--boundaries-only" in sys.argv

def track_distance(track, from_ms, to_ms):
    s = [p for p in track if from_ms <= p["ms"] <= to_ms and p["acc"] <= 25]
    return sum(hav((s[i]["lat"], s[i]["lng"]), (s[i+1]["lat"], s[i+1]["lng"])) for i in range(len(s) - 1))

def repair_legs(marks_a, marks_b, track_a):
    """Verwirft 50er-Marken, deren Teilstrecke eine unmoegliche Dichte ergibt."""
    while True:
        steps_at = []
        prev = 0
        for m in marks_a:
            if m["kind"] == "stairs_start":
                steps_at.append(prev)
            else:
                prev = m["cum"] if m["cum"] is not None else prev
                steps_at.append(prev)

        worst_rate, worst_i = 0.0, None
        for i in range(len(marks_a) - 1):
            if marks_a[i + 1]["kind"] != "step_marker":
                continue           # Grenzen sind gesetzt und werden nie verworfen
            ds = steps_at[i + 1] - steps_at[i]
            if ds <= 0:
                continue
            d = track_distance(track_a, marks_a[i]["ms"], marks_a[i + 1]["ms"])
            rate = ds / max(0.1, d)
            if rate > worst_rate:
                worst_rate, worst_i = rate, i + 1

        # Auch die Teilstrecke NACH einer Marke pruefen: eine zu spaet getippte
        # Marke macht die folgende Teilstrecke unmoeglich dicht.
        for i in range(len(marks_a) - 1):
            if marks_a[i]["kind"] != "step_marker":
                continue
            ds = steps_at[i + 1] - steps_at[i]
            if ds <= 0:
                continue
            d = track_distance(track_a, marks_a[i]["ms"], marks_a[i + 1]["ms"])
            rate = ds / max(0.1, d)
            if rate > worst_rate:
                worst_rate, worst_i = rate, i

        if worst_rate <= MAX_STEPS_PER_M or worst_i is None:
            return marks_a, marks_b
        del marks_a[worst_i]
        del marks_b[worst_i]

def build(marks_a, track_a, marks_b, track_b, altitude_from):
    assert len(marks_a) == len(marks_b), "Beide Geraete brauchen dieselbe Markenzahl"
    for a, b in zip(marks_a, marks_b):
        assert a["kind"] == b["kind"] and a["cum"] == b["cum"], "Marken passen nicht zusammen"

    # NUR Abschnittsgrenzen sind Anker. Die 50er-Marken tragen Tipp-Verzoegerung:
    # im Kalibriergang behauptete die Teilstrecke 600->663 Stufen auf 8,9 m bei
    # 4,1 m Hoehengewinn, also 6,5 cm pro Stufe - physikalisch unmoeglich. Die
    # Grenzen dagegen wurden im Stehen bewusst eingetragen. Innerhalb eines
    # Treppenabschnitts werden die Stufen deshalb gleichmaessig ueber die
    # gemessene Strecke verteilt; die Stufendichte schwankt dort real nur
    # zwischen 1,6 und 2,4 Stufen pro Meter.
    # Alle Marken sind Anker, aber Teilstrecken mit physikalisch unmoeglicher
    # Stufendichte werden mit dem Nachbarn verschmolzen. Treppen haben 12-25 cm
    # Steigung und 25-35 cm Auftritt, also grob 1,0 bis 3,5 Stufen pro Meter.
    # Der Kalibriergang enthielt eine Teilstrecke mit 7,1 Stufen/m - dort wurde
    # die 50er-Marke verspaetet getippt.
    if BOUNDARIES_ONLY:
        keep = [i for i, m in enumerate(marks_a) if m["kind"] in ("stairs_start", "stairs_end")]
        marks_a = [marks_a[i] for i in keep]
        marks_b = [marks_b[i] for i in keep]
    else:
        marks_a, marks_b = repair_legs(marks_a, marks_b, track_a)

    vertices = []          # (steps, lat, lng, alt)
    steps_before = 0

    for i in range(len(marks_a) - 1):
        a0, a1 = marks_a[i], marks_a[i + 1]
        b0, b1 = marks_b[i], marks_b[i + 1]

        start_steps = a0["cum"] if a0["kind"] in ("stairs_end", "step_marker") else steps_before
        if a1["kind"] == "stairs_start":
            end_steps = start_steps      # stufenloser Abschnitt: Zaehler steht
        else:
            end_steps = a1["cum"] if a1["cum"] is not None else start_steps

        seg_a = segment_points(track_a, a0["ms"], a1["ms"])
        seg_b = segment_points(track_b, b0["ms"], b1["ms"])
        # Anzahl Zwischenpunkte nach Laenge des Abschnitts
        rough = hav((a0["lat"], a0["lng"]), (a1["lat"], a1["lng"]))
        n = max(2, min(24, int(rough / 8) + 2))

        ra = resample([{"lat": a0["lat"], "lng": a0["lng"], "alt": a0["alt"]}] + seg_a +
                      [{"lat": a1["lat"], "lng": a1["lng"], "alt": a1["alt"]}], n)
        rb = resample([{"lat": b0["lat"], "lng": b0["lng"], "alt": b0["alt"]}] + seg_b +
                      [{"lat": b1["lat"], "lng": b1["lng"], "alt": b1["alt"]}], n)

        merged = []
        for pa, pb in zip(ra, rb):
            alt_src = pa if altitude_from == "a" else pb
            merged.append({
                "lat": (pa["lat"] + pb["lat"]) / 2,
                "lng": (pa["lng"] + pb["lng"]) / 2,
                "alt": alt_src["alt"],
            })

        # Stufen linear ueber die Distanz innerhalb des Abschnitts verteilen
        cum = [0.0]
        for x, y in zip(merged, merged[1:]):
            cum.append(cum[-1] + hav((x["lat"], x["lng"]), (y["lat"], y["lng"])))
        total = cum[-1] if cum[-1] > 0 else 1.0
        for k, p in enumerate(merged):
            if k == 0 and vertices:
                continue     # Endpunkt des Vorgaengers nicht doppeln
            frac = cum[k] / total
            steps = start_steps + (end_steps - start_steps) * frac
            vertices.append((steps, p["lat"], p["lng"], p["alt"]))
        steps_before = end_steps

    return vertices

def simplify(vertices, eps_m=2.0):
    """Douglas-Peucker, aber Punkte mit Stufenwechsel-Charakter bleiben."""
    keep = {0, len(vertices) - 1}
    # Abschnittsgrenzen erkennen: dort aendert sich die Stufenrate deutlich
    for i in range(1, len(vertices) - 1):
        prev_rate = vertices[i][0] - vertices[i-1][0]
        next_rate = vertices[i+1][0] - vertices[i][0]
        if abs(prev_rate - next_rate) > 0.8:
            keep.add(i)

    def dp(i0, i1):
        if i1 <= i0 + 1:
            return
        a = (vertices[i0][1], vertices[i0][2]); b = (vertices[i1][1], vertices[i1][2])
        dmax, imax = -1, None
        for i in range(i0 + 1, i1):
            p = (vertices[i][1], vertices[i][2])
            # Punkt-Linien-Abstand grob ueber Dreiecksflaeche
            d_ab = hav(a, b)
            if d_ab <= 0:
                d = hav(a, p)
            else:
                d_ap, d_bp = hav(a, p), hav(b, p)
                s = (d_ab + d_ap + d_bp) / 2
                area = max(0.0, s * (s - d_ab) * (s - d_ap) * (s - d_bp)) ** 0.5
                d = 2 * area / d_ab
            if d > dmax:
                dmax, imax = d, i
        if dmax > eps_m and imax is not None:
            keep.add(imax)
            dp(i0, imax); dp(imax, i1)

    anchors = sorted(keep)
    for a, b in zip(anchors, anchors[1:]):
        dp(a, b)
    return [vertices[i] for i in sorted(keep)]

if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    ma = load_marks(f"{base}/android-tusiger-calibration-marks-02fb3566-3f11-4a8c-a860-467d3d0e6db3.csv")
    ta = load_track(f"{base}/android-tusiger-calibration-track-02fb3566-3f11-4a8c-a860-467d3d0e6db3.csv")
    mi = load_marks(f"{base}/iphone-tusiger-calibration-marks-acfa986d-2ebd-4180-8cbd-6d735ccecd9f.csv")
    ti = load_track(f"{base}/iphone-tusiger-calibration-track-acfa986d-2ebd-4180-8cbd-6d735ccecd9f.csv")

    # Hoehe vom iPhone: Android liefert ellipsoidische Hoehe (+38 m Versatz).
    verts = build(ma, ta, mi, ti, altitude_from="b")
    verts = simplify(verts, eps_m=2.0)

    total = 0.0
    for a, b in zip(verts, verts[1:]):
        total += hav((a[1], a[2]), (b[1], b[2]))

    print(f"// Vertices: {len(verts)}, Routenlaenge {total:.1f} m")
    print("export const routeModelVersion = 3;")
    print("")
    print("export const routeWaypoints: RouteWaypoint[] = [")
    last_steps = -1
    for steps, lat, lng, alt in verts:
        s = max(0, min(1150, int(round(steps))))
        s = max(s, last_steps)          # streng monoton
        last_steps = s
        a = 425.0 if alt is None else alt
        print(f"  {{ steps: {s}, lat: {lat:.6f}, lng: {lng:.6f}, altM: {a:.1f} }},")
    print("];")
