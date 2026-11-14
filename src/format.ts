import type { Status } from "./types";

export const STATUS_COLOR: Record<Status, string> = {
  UNKNOWN: "#8b95a5",
  NORMAL: "#2fa866",
  WARNING: "#e0a100",
  CRITICAL: "#d9382f",
};

export const STATUS_LABEL: Record<Status, string> = {
  UNKNOWN: "Невідомо",
  NORMAL: "Норма",
  WARNING: "Увага",
  CRITICAL: "Критично",
};

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("uk-UA") : "—";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("uk-UA");
