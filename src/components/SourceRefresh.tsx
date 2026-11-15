import { describeError } from "../errors";
import { useI18n, type Key } from "../i18n";
import type { Source } from "../polling";

export default function SourceRefresh({ source, label }: { source: Source<unknown>; label?: Key }) {
  const { t, fmtDateTime } = useI18n();
  const { error, updatedAt } = source;
  const state = error !== null ? (updatedAt ? "stale" : "offline") : (updatedAt ? "fresh" : "loading");
  return (
    <span className={`source-refresh ${state}`} title={error ? describeError(error, t) : undefined}>
      {label && <span className="source-label">{t(label)}</span>}
      <span className="source-dot" aria-hidden="true" />
      {updatedAt ? (
        <time dateTime={updatedAt}>{t(`data.${state}`, { time: fmtDateTime(updatedAt) })}</time>
      ) : <span>{t(`data.${state}`)}</span>}
    </span>
  );
}
