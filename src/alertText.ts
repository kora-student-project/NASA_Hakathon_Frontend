import { alertTrigger } from "./alertTrigger";
import type { Key, Lang } from "./i18n";
import type { Alert } from "./types";

type T = (key: Key, params?: Record<string, string | number>) => string;

/** Локалізований рядок причини попередження; якщо формат повідомлення невідомий — повертає текст сервера. */
export function localizedAlertMessage(alert: Alert, t: T, lang: Lang): string {
  const trigger = alertTrigger(alert);
  const n = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  if (trigger?.kind === "satellite")
    return t("panel.reasonSatellite", { value: n.format(trigger.value), limit: n.format(trigger.limit) });
  if (trigger?.kind === "tilt")
    return t("panel.reasonTilt", { axis: trigger.axis, value: n.format(trigger.value), limit: n.format(trigger.limit) });
  return alert.message;
}
