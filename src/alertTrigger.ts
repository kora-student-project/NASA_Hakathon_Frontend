import type { Alert } from "./types";

// Older alert rows only store the server's message. Keep that message as the UI fallback
// for unrecognised formats, rather than substituting a more recent measurement.
const SATELLITE = /^(?:WARNING|CRITICAL): satellite displacement (-?\d+(?:\.\d+)?) mm exceeds (\d+(?:\.\d+)?) mm \(.+, (\d{4}-\d{2}-\d{2})\)\./;
const TILT = /^(?:WARNING|CRITICAL): tilt_([xy])=(-?\d+(?:\.\d+)?)° exceeds (\d+(?:\.\d+)?)° \(/;

export function alertTrigger(alert: Alert) {
  if (alert.sensor_id === null) {
    const match = SATELLITE.exec(alert.message);
    if (!match) return null;
    const [, value, limit, date] = match;
    return { kind: "satellite" as const, value: Number(value), limit: Number(limit), date };
  }

  const match = TILT.exec(alert.message);
  if (!match) return null;
  const [, axis, value, limit] = match;
  return { kind: "tilt" as const, axis: axis.toUpperCase(), value: Number(value), limit: Number(limit) };
}
