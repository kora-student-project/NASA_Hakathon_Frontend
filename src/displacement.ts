import type { Status, Thresholds } from "./types";

export function toMillimetres(value: number, unit: string): number | null {
  switch (unit.trim().toLowerCase()) {
    case "mm": return Number.isFinite(value) ? value : null;
    case "cm": return Number.isFinite(value * 10) ? value * 10 : null;
    case "m": return Number.isFinite(value * 1000) ? value * 1000 : null;
    default: return null;
  }
}

export function displacementStatus(valueMm: number | null, thresholds: Thresholds | null): Status {
  const warning = thresholds?.displacement_warning_mm;
  const critical = thresholds?.displacement_critical_mm;
  if (valueMm === null || warning == null || critical == null ||
      !Number.isFinite(warning) || !Number.isFinite(critical) || warning <= 0 || critical <= warning) {
    return "UNKNOWN";
  }
  if (Math.abs(valueMm) > critical) return "CRITICAL";
  if (Math.abs(valueMm) > warning) return "WARNING";
  return "NORMAL";
}
