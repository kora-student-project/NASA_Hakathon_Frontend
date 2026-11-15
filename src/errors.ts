import type { Key } from "./i18n";

type T = (key: Key, params?: Record<string, string | number>) => string;

/** Перетворює сирий текст помилки (`401: …`, `Failed to fetch`, `signal timed out`) на переклад. */
export function describeError(message: string, t: T): string {
  const code = /^(\d{3})\b/.exec(message)?.[1];
  if (!code) return t("errors.network");
  switch (code) {
    case "401": return t("errors.unauthorized");
    case "403": return t("errors.forbidden");
    case "404": return t("errors.notFound");
    case "429": return t("errors.rateLimit");
    default: return Number(code) >= 500 ? t("errors.server", { code }) : message;
  }
}
