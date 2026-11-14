import type { Measurement } from "./types";

export const AXES = ["x", "y", "z"] as const;
export type SensorSeries = "tilt" | "accel" | "gyro";

export function measurementAxes(row: Measurement, series: SensorSeries) {
  if (series === "tilt") return { x: row.tilt_x, y: row.tilt_y, z: null };
  return row.extra?.[series] ?? { x: null, y: null, z: null };
}
