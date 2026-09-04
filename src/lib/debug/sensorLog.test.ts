import { describe, expect, it } from "vitest";
import { sensorLog } from "./sensorLog";

const gpsFix = {
  lat: 47.315188,
  lng: 7.886946,
  altitudeM: 425.5,
  accuracyM: 6,
  speedMps: 0.7,
  heading: 318,
  recordedAt: new Date(1_000).toISOString()
};

describe("Sensor-Logger CSV", () => {
  it("schreibt die vereinbarte Kopfzeile", () => {
    sensorLog.start("run-1", "challenge-1", 0);
    sensorLog.recordGps(gpsFix, { stageIndex: 2, computedSteps: 120, computedDistanceM: 51.5 });
    sensorLog.stop();

    const lines = sensorLog.toCsv().trim().split("\n");
    const header = lines.find((line) => line.startsWith("timestamp_ms"));
    expect(header).toBe(
      "timestamp_ms,acc_x,acc_y,acc_z,lin_acc_x,lin_acc_y,lin_acc_z,gyro_x,gyro_y,gyro_z," +
      "mag_x,mag_y,mag_z,pressure_hPa,altitude_m," +
      "gps_lat,gps_lon,gps_alt,gps_speed,gps_heading,gps_accuracy,gps_provider," +
      "step_detector,step_counter,stage_index,computed_steps,computed_distance_m,detected_steps,fused_steps,run_id,challenge_id"
    );
  });

  it("schreibt GPS-Fix und App-Zustand in eine Zeile", () => {
    sensorLog.start("run-2", "challenge-1", 0);
    sensorLog.recordGps(gpsFix, { stageIndex: 2, computedSteps: 120, computedDistanceM: 51.5 });
    sensorLog.stop();

    const row = sensorLog.toCsv().trim().split("\n").at(-1)!.split(",");
    expect(row[0]).toBe("1000");            // ms seit Laufstart
    expect(row[15]).toBe("47.315188");      // gps_lat
    expect(row[20]).toBe("6");              // gps_accuracy
    expect(row[21]).toBe("gps");            // provider
    expect(row[24]).toBe("2");              // stage_index
    expect(row[25]).toBe("120");            // computed_steps
    expect(row.at(-2)).toBe("run-2");
    expect(row.at(-1)).toBe("challenge-1");
  });

  it("zeichnet nichts auf, solange der Logger nicht laeuft", () => {
    sensorLog.start("run-3", "challenge-1", 0);
    sensorLog.stop();
    sensorLog.recordGps(gpsFix, { stageIndex: 0, computedSteps: 0, computedDistanceM: 0 });
    expect(sensorLog.sampleCount).toBe(0);
    expect(sensorLog.hasDataFor("run-3")).toBe(false);
  });

  it("liefert eine Label-Vorlage mit Kopfzeile", () => {
    sensorLog.start("run-4", "challenge-1", 0);
    sensorLog.recordGps(gpsFix, { stageIndex: 0, computedSteps: 0, computedDistanceM: 0 });
    sensorLog.stop();
    expect(sensorLog.toLabelsCsv().split("\n")[0]).toBe("run_id,start_ms,end_ms,stage_label,real_step_count");
  });
});
