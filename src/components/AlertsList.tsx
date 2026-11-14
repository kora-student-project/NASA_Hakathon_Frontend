import { useI18n } from "../i18n";
import type { Source } from "../polling";
import type { Alert, MonitoredObject } from "../types";
import SourceRefresh from "./SourceRefresh";

interface Props {
  source: Source<Alert[]>;
  objects: MonitoredObject[];
  selectedId: number | null;
  onClear: () => void;
  onSelect: (objectId: number) => void;
  canResolve: boolean;
  onResolve: (id: number) => void;
  resolveError: string | null;
  filter: "ALL" | "WARNING" | "CRITICAL";
  setFilter: (f: "ALL" | "WARNING" | "CRITICAL") => void;
  showResolved: boolean;
  setShowResolved: (v: boolean) => void;
}

export default function AlertsList({
  source,
  objects,
  selectedId,
  onClear,
  onSelect,
  canResolve,
  onResolve,
  resolveError,
  filter,
  setFilter,
  showResolved,
  setShowResolved,
}: Props) {
  const { t, fmtDateTime } = useI18n();
  const name = (id: number) => objects.find((o) => o.id === id)?.name ?? t("alerts.object", { id });
  const shown = (source.data ?? []).filter(
    (a) => (selectedId === null || a.object_id === selectedId) && (filter === "ALL" || a.severity === filter),
  );
  return (
    <section className="card">
      <div className="row">
        <h3>{selectedId !== null ? t("alerts.titleFor", { name: name(selectedId) }) : t("alerts.titleAll")}</h3>
        <div className="controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value as Props["filter"])}>
            <option value="ALL">{t("alerts.all")}</option>
            <option value="WARNING">{t("alerts.warning")}</option>
            <option value="CRITICAL">{t("alerts.critical")}</option>
          </select>
          <label className="check">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            {t("alerts.resolvedFilter")}
          </label>
        </div>
      </div>
      <div className="source-row"><SourceRefresh source={source} /></div>
      {resolveError && <p className="error" role="alert">{t("alerts.resolveError", { error: resolveError })}</p>}
      {selectedId !== null && (
        <button className="link" onClick={onClear}>
          {t("alerts.showAll")}
        </button>
      )}
      {source.data && shown.length === 0 && <p className="muted">{t("alerts.none")}</p>}
      <ul className="alerts">
        {shown.map((a) => (
          <li key={a.id} className={`alert ${a.severity.toLowerCase()} ${a.is_resolved ? "done" : ""}`}>
            <div className="row">
              <button className="link" onClick={() => onSelect(a.object_id)}>
                {name(a.object_id)}
              </button>
              <span className="small muted">{fmtDateTime(a.created_at)}</span>
            </div>
            <div className="msg">{a.message}</div>
            <div className="row">
              <span className="small muted">
                {a.sensor_id ? t("alerts.sensor", { id: a.sensor_id }) : t("alerts.satellite")}
                {a.is_resolved ? ` · ${t("alerts.resolved")}` : ""}
              </span>
              {!a.is_resolved && (
                <button
                  className="btn"
                  disabled={!canResolve}
                  title={canResolve ? "" : t("alerts.needKey")}
                  onClick={() => onResolve(a.id)}
                >
                  {t("alerts.resolve")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
