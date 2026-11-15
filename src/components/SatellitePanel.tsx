import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toMillimetres } from "../displacement";
import { useI18n } from "../i18n";
import type { Source } from "../polling";
import type { Alert, ObjectStatus, SatelliteCollection, Thresholds } from "../types";
import SourceRefresh from "./SourceRefresh";
import StatusBadge from "./StatusBadge";

export default function SatellitePanel({ objectId, satellite, status, thresholds, alerts }: {
  objectId: number;
  satellite: Source<SatelliteCollection>;
  status: ObjectStatus | null;
  thresholds: Source<Thresholds>;
  alerts: Alert[];
}) {
  const { t, fmtDate } = useI18n();
  // shortcut: App опитує найновіші 1000 спостережень по всіх об'єктах; панель лише фільтрує їх (без власного запиту).
  // Якщо спостережень стане набагато більше, підтягніть історію об'єкта окремим запитом.
  const history = useMemo<Source<SatelliteCollection>>(() => ({
    ...satellite,
    data: satellite.data && {
      ...satellite.data,
      features: satellite.data.features.filter((f) => f.properties.object_id === objectId),
    },
  }), [satellite, objectId]);

  const latest = history.data ? history.data.features[0]?.properties : status?.latest_satellite_data;
  const ageDays = latest ? Math.floor((Date.now() - Date.parse(latest.observation_date)) / 86_400_000) : null;
  const satelliteAlerts = alerts.filter((alert) =>
    alert.object_id === objectId && alert.sensor_id === null && !alert.is_resolved);
  const value = latest ? toMillimetres(latest.displacement, latest.unit) : null;
  const level = latest?.severity ?? "UNKNOWN"; // оцінку дає бекенд, тут її не перераховуємо
  const th = thresholds.data;
  const validThresholds = th && th.displacement_warning_mm > 0 && th.displacement_critical_mm > th.displacement_warning_mm ? th : null;
  const chart = (history.data?.features ?? []).flatMap(({ properties: p }) => {
    const mm = toMillimetres(p.displacement, p.unit);
    const date = Date.parse(p.observation_date);
    return mm !== null && Number.isFinite(date) ? [{ mm, date, source: p.source }] : [];
  }).sort((a, b) => a.date - b.date);
  const dates = [...new Set(chart.map(({ date }) => date))];
  const dateTicks = dates.length > 4
    ? [0, 1, 2, 3].map((i) => dates[Math.round(i * (dates.length - 1) / 3)])
    : dates;
  const thresholdLines = validThresholds ? [
    { mm: validThresholds.displacement_warning_mm, color: "#fbbc58" },
    { mm: validThresholds.displacement_critical_mm, color: "#fa727b" },
  ] : [];

  return (
    <section className="card satellite-card">
      <div className="row">
        <h3>{t("sat.title")}</h3>
        <StatusBadge status={level} />
      </div>
      <div className="source-row"><SourceRefresh source={history} label="data.satelliteHistory" /></div>
      {latest ? (
        <div className="sat-reading">
          <strong>{latest.displacement} <small>{latest.unit}</small></strong>
          <span className="muted">{t("sat.latest")} · {fmtDate(latest.observation_date)}</span>
        </div>
      ) : history.data && <p className="muted">{t("sat.noLatest")}</p>}
      {ageDays !== null && ageDays > 30 && <p className="warn-note">{t("sat.old", { days: ageDays })}</p>}
      {validThresholds ? (
        <div className="sat-thresholds">
          <span><i className="swatch warning" />{t("status.WARNING")} &gt; {validThresholds.displacement_warning_mm} {t("unit.mm")}</span>
          <span><i className="swatch critical" />{t("status.CRITICAL")} &gt; {validThresholds.displacement_critical_mm} {t("unit.mm")}</span>
        </div>
      ) : thresholds.data && <p className="muted small">{t("sat.noThresholds")}</p>}
      <div className="source-row"><SourceRefresh source={thresholds} label="data.thresholds" /></div>
      {latest && value === null && <p className="muted small">{t("sat.unknownUnit")}</p>}
      {chart.length > 0 ? (
        <>
          <h4>{t("sat.history")}</h4>
          <div className="sat-chart">
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 12, right: 24, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="#253547" strokeDasharray="3 4" />
                <XAxis dataKey="date" type="number" domain={["dataMin", "dataMax"]}
                  ticks={dateTicks}
                  tickFormatter={(v: number) => fmtDate(new Date(v).toISOString().slice(0, 10))}
                  fontSize={10} tick={{ fill: "#b5c3d3" }} />
                <YAxis unit={` ${t("unit.mm")}`} fontSize={10} tick={{ fill: "#b5c3d3" }} />
                <Tooltip labelFormatter={(v) => fmtDate(new Date(Number(v)).toISOString().slice(0, 10))}
                  formatter={(v, _name, point) => [`${v} ${t("unit.mm")}`, point.payload?.source || t("map.displacement")]}
                  contentStyle={{ background: "#121923", border: "1px solid #34465c", borderRadius: 8 }} />
                {thresholdLines.flatMap(({ mm, color }) => [mm, -mm].map((limit) => (
                  <ReferenceLine key={limit} y={limit} stroke={color} strokeDasharray="5 4" ifOverflow="extendDomain" />
                )))}
                <Line dataKey="mm" stroke="#bca7ff" strokeWidth={0}
                  dot={{ r: 4, fill: "#bca7ff", stroke: "#19182c", strokeWidth: 1 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : history.data && <p className="muted small">{t("sat.noHistory")}</p>}
      {satelliteAlerts.length > 0 && (
        <div className="sat-alerts">
          <h4>{t("sat.activeAlerts")}</h4>
          {satelliteAlerts.map((alert) => <StatusBadge key={alert.id} status={alert.severity} />)}
        </div>
      )}
      <p className="signal-note">{t("sat.explanation")}</p>
    </section>
  );
}
