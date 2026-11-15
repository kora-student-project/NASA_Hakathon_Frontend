import { useCallback } from "react";
import { alertTrigger } from "../alertTrigger";
import { displayStatus } from "../objectStatuses";
import { api } from "../api";
import { useI18n } from "../i18n";
import { usePolling, type Source } from "../polling";
import type { Alert, MonitoredObject, ObjectStatus } from "../types";
import SourceRefresh from "./SourceRefresh";
import StatusBadge from "./StatusBadge";

function StatusReason({ objectId, severity, refreshKey }: {
  objectId: number;
  severity: "WARNING" | "CRITICAL";
  refreshKey: number;
}) {
  const { t } = useI18n();
  const load = useCallback((signal: AbortSignal) =>
    api.alerts({ objectId, severity, resolved: false, limit: 1 }, signal), [objectId, severity]);
  const source = usePolling(load, refreshKey);
  const alert = source.data?.find((a) => a.object_id === objectId && a.severity === severity && !a.is_resolved);

  return (
    <div className={`status-reason ${severity.toLowerCase()}`}>
      <span className="label">{t("panel.reason")}</span>
      {alert && <ReasonDetail alert={alert} />}
      {!alert && (source.data !== null || source.error !== null) && <p>{t("panel.reasonUnavailable")}</p>}
      <SourceRefresh source={source} />
    </div>
  );
}

function ReasonDetail({ alert }: { alert: Alert }) {
  const { t, lang, fmtDate, fmtDateTime } = useI18n();
  const trigger = alertTrigger(alert);
  const number = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  let message = alert.message;
  if (trigger?.kind === "satellite") {
    message = t("panel.reasonSatellite", { value: number.format(trigger.value), limit: number.format(trigger.limit) });
  } else if (trigger?.kind === "tilt") {
    message = t("panel.reasonTilt", { axis: trigger.axis, value: number.format(trigger.value), limit: number.format(trigger.limit) });
  }
  return (
    <>
      <p className="status-reason-text">{message}</p>
      <span className="small muted">{trigger?.kind === "satellite"
        ? t("panel.reasonObservation", { date: fmtDate(trigger.date) })
        : t("panel.reasonAlertDate", { date: fmtDateTime(alert.created_at) })}</span>
    </>
  );
}

export default function ObjectPanel({ obj, status, refreshKey }: {
  obj: MonitoredObject;
  status: Source<ObjectStatus>;
  refreshKey: number;
}) {
  const { t, fmtDateTime } = useI18n();
  const data = status.data;
  const s = data?.latest_sensor_data;
  const st = displayStatus(status);
  return (
    <section className={`card hero ${st.toLowerCase()}`}>
      <div className="row">
        <h2>{obj.name}</h2>
        <StatusBadge status={st} />
      </div>
      {(st === "WARNING" || st === "CRITICAL") && <StatusReason objectId={obj.id} severity={st} refreshKey={refreshKey} />}
      <div className="source-row"><SourceRefresh source={status} label="data.building" /></div>
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
        <div className={`stat ${(data?.active_alerts ?? 0) > 0 ? "hot" : ""}`}>
          <span className="label">{t("panel.activeAlerts")}</span>
          <b>{data?.active_alerts ?? "—"}</b>
        </div>
        <div className="stat">
          <span className="label">{t("panel.updated")}</span>
          <b className="small">{fmtDateTime(data?.last_updated)}</b>
        </div>
      </div>
      {data?.status === "UNKNOWN" && <p className="muted">{t("panel.notEnough")}</p>}
      <p className="disclaimer">{t("panel.disclaimer")}</p>
    </section>
  );
}
