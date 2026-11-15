export function toMillimetres(value: number, unit: string): number | null {
  switch (unit.trim().toLowerCase()) {
    case "mm": return Number.isFinite(value) ? value : null;
    case "cm": return Number.isFinite(value * 10) ? value * 10 : null;
    case "m": return Number.isFinite(value * 1000) ? value * 1000 : null;
    default: return null;
  }
}
