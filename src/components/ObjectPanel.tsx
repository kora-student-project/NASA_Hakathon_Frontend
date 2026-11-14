import { fmtDate, fmtDateTime } from "../format";
import type { MonitoredObject, ObjectStatus } from "../types";
import StatusBadge from "./StatusBadge";

export default function ObjectPanel({ obj, status }: { obj: MonitoredObject; status?: ObjectStatus }) {
  const s = status?.latest_sensor_data;
  const sat = status?.latest_satellite_data;
  return (
    <section className="card">
      <div className="row">
        <h2>{obj.name}</h2>
        <StatusBadge status={status?.status ?? "UNKNOWN"} />
      </div>
      {obj.description && <p className="muted">{obj.description}</p>}
      <p className="muted">
        {obj.latitude.toFixed(5)}, {obj.longitude.toFixed(5)}
      </p>
      <div className="grid2">
        <div className="stat">
          <span className="label">Нахил X</span>
          <b>{s ? `${s.tilt_x.toFixed(2)}°` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">Нахил Y</span>
          <b>{s ? `${s.tilt_y.toFixed(2)}°` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">Температура</span>
          <b>{s?.temperature != null ? `${s.temperature.toFixed(1)} °C` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">Зміщення (NISAR)</span>
          <b>{sat ? `${sat.displacement} ${sat.unit}` : "—"}</b>
          {sat && <span className="label">{fmtDate(sat.observation_date)}</span>}
        </div>
        <div className="stat">
          <span className="label">Активні попередження</span>
          <b>{status?.active_alerts ?? 0}</b>
        </div>
        <div className="stat">
          <span className="label">Оновлено</span>
          <b className="small">{fmtDateTime(status?.last_updated)}</b>
        </div>
      </div>
      {status?.status === "UNKNOWN" && (
        <p className="muted">Недостатньо даних для оцінки стану.</p>
      )}
      <p className="disclaimer">Попередження — індикатори для перевірки, а не висновок про аварійність.</p>
    </section>
  );
}
