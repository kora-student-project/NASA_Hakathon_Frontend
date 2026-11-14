import { fmtDateTime } from "../format";
import type { Alert, MonitoredObject } from "../types";

interface Props {
  alerts: Alert[];
  objects: MonitoredObject[];
  onSelect: (objectId: number) => void;
  canResolve: boolean;
  onResolve: (id: number) => void;
  filter: "ALL" | "WARNING" | "CRITICAL";
  setFilter: (f: "ALL" | "WARNING" | "CRITICAL") => void;
  showResolved: boolean;
  setShowResolved: (v: boolean) => void;
}

export default function AlertsList({
  alerts,
  objects,
  onSelect,
  canResolve,
  onResolve,
  filter,
  setFilter,
  showResolved,
  setShowResolved,
}: Props) {
  const name = (id: number) => objects.find((o) => o.id === id)?.name ?? `Об'єкт ${id}`;
  const shown = alerts.filter((a) => filter === "ALL" || a.severity === filter);
  return (
    <section className="card">
      <div className="row">
        <h3>Попередження</h3>
        <div className="controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value as Props["filter"])}>
            <option value="ALL">Усі</option>
            <option value="WARNING">Увага</option>
            <option value="CRITICAL">Критичні</option>
          </select>
          <label className="check">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            вирішені
          </label>
        </div>
      </div>
      {shown.length === 0 && <p className="muted">Немає попереджень.</p>}
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
                {a.sensor_id ? `Датчик #${a.sensor_id}` : "Супутник"}
                {a.is_resolved ? " · вирішено" : ""}
              </span>
              {!a.is_resolved && (
                <button className="btn" disabled={!canResolve} title={canResolve ? "" : "Введіть admin-ключ"} onClick={() => onResolve(a.id)}>
                  Вирішено
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
