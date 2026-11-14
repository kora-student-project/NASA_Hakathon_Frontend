import { useI18n } from "../i18n";
import type { MonitoredObject, ObjectStatus } from "../types";
import StatusBadge from "./StatusBadge";

export default function ObjectPanel({ obj, status }: { obj: MonitoredObject; status?: ObjectStatus }) {
  const { t, fmtDate, fmtDateTime } = useI18n();
  const s = status?.latest_sensor_data;
  const sat = status?.latest_satellite_data;
  const st = status?.status ?? "UNKNOWN";
  return (
    <section className={`card hero ${st.toLowerCase()}`}>
      <div className="row">
        <h2>{obj.name}</h2>
        <StatusBadge status={st} />
      </div>
      {obj.description && <p className="muted">{obj.description}</p>}
      <p className="coords">
        {obj.latitude.toFixed(5)}, {obj.longitude.toFixed(5)}
      </p>
      <div className="grid2">
        <div className="stat">
          <span className="label">{t("panel.tiltX")}</span>
          <b>{s ? `${s.tilt_x.toFixed(2)}°` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">{t("panel.tiltY")}</span>
          <b>{s ? `${s.tilt_y.toFixed(2)}°` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">{t("panel.temperature")}</span>
          <b>{s?.temperature != null ? `${s.temperature.toFixed(1)} °C` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">{t("panel.humidity")}</span>
          <b>{s?.humidity != null ? `${s.humidity.toFixed(0)} %` : "—"}</b>
        </div>
        <div className="stat">
          <span className="label">{t("panel.displacement")}</span>
          <b>{sat ? `${sat.displacement} ${sat.unit}` : "—"}</b>
          {sat && <span className="label">{fmtDate(sat.observation_date)}</span>}
        </div>
        <div className={`stat ${(status?.active_alerts ?? 0) > 0 ? "hot" : ""}`}>
          <span className="label">{t("panel.activeAlerts")}</span>
          <b>{status?.active_alerts ?? 0}</b>
        </div>
        <div className="stat wide">
          <span className="label">{t("panel.updated")}</span>
          <b className="small">{fmtDateTime(status?.last_updated)}</b>
        </div>
      </div>
      {st === "UNKNOWN" && <p className="muted">{t("panel.notEnough")}</p>}
      <p className="disclaimer">{t("panel.disclaimer")}</p>
    </section>
  );
}
