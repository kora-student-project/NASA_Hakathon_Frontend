import { useCallback, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { useI18n, type Key } from "../i18n";
import { AXES, measurementAxes, type SensorSeries } from "../imu";
import { usePolling } from "../polling";
import type { Thresholds } from "../types";
import SourceRefresh from "./SourceRefresh";

const RANGES: { key: Key; hours: number }[] = [
  { key: "chart.1h", hours: 1 },
  { key: "chart.24h", hours: 24 },
  { key: "chart.7d", hours: 24 * 7 },
  { key: "chart.all", hours: 0 },
];

export default function TiltChart({ objectId, thresholds: th }: {
  objectId: number;
  thresholds: Thresholds | null;
}) {
  const { t, fmtDateTime, fmtTime } = useI18n();
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [hours, setHours] = useState(24 * 7);
  const [series, setSeries] = useState<SensorSeries>("tilt");
  const loadSensors = useCallback((signal: AbortSignal) => api.sensors(objectId, signal), [objectId]);
  const sensorSource = usePolling(loadSensors);
  const sensors = sensorSource.data ?? [];
  const selectedId = sensors.find((sensor) => sensor.id === sensorId)?.id ?? sensors[0]?.id;
  const loadHistory = useMemo(() => {
    if (selectedId === undefined) return null;
    return (signal: AbortSignal) => {
      const from = hours ? new Date(Date.now() - hours * 3600_000).toISOString() : null;
      return api.history(selectedId, from, signal);
    };
  }, [selectedId, hours]);
  const history = usePolling(loadHistory);
  const data = history.data ?? [];
  const keys = series === "tilt" ? AXES.slice(0, 2) : AXES;
  const chart = [...data].reverse().map((row) => ({ timestamp: row.timestamp, ...measurementAxes(row, series) }));
  const hasSeries = chart.some((row) => keys.some((key) => row[key] !== null));
  const latest = chart.at(-1);
  const unit = series === "tilt" ? "°" : series === "accel" ? " m/s²" : "";

  return (
    <section className="card">
      <div className="row">
        <h3>{t("chart.title")}</h3>
        <div className="controls">
          {sensors.length > 1 && (
            <select aria-label={t("chart.sensor")} value={selectedId ?? ""} onChange={(e) => setSensorId(Number(e.target.value))}>
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <select aria-label={t("chart.range")} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.key} value={r.hours}>
                {t(r.key)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="source-row">
        {selectedId !== undefined && <SourceRefresh source={history} />}
        {(selectedId === undefined || sensorSource.error) && <SourceRefresh source={sensorSource} label="data.sensors" />}
      </div>
      <div className="seg chart-tabs" role="group" aria-label={t("chart.title")}>
        {(["tilt", "accel", "gyro"] as const).map((group) => (
          <button key={group} type="button" className={series === group ? "on" : ""}
            aria-pressed={series === group} onClick={() => setSeries(group)}>{t(`panel.${group}`)}</button>
        ))}
      </div>
      {sensorSource.data?.length === 0 && <p className="muted">{t("chart.noSensors")}</p>}
      {history.data?.length === 0 && <p className="muted">{t("chart.noData")}</p>}
      {data.length > 0 && !hasSeries && <p className="muted">{t("chart.noSeries")}</p>}
      {series === "gyro" && hasSeries && <p className="muted small">{t("chart.gyroUnit")}</p>}
      {latest && hasSeries && (
        <div className="imu-group">
          <span className="label">{t("chart.latest")} · {fmtDateTime(latest.timestamp)}</span>
          <div className="axes" style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}>
            {keys.map((key) => <span key={key}><small>{key.toUpperCase()}</small>
              <b>{latest[key] == null ? "—" : `${latest[key].toFixed(3)}${unit}`}</b></span>)}
          </div>
        </div>
      )}
      {hasSeries && (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3a" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v: string) => fmtTime(v)}
                stroke="#8b95a5"
                fontSize={11}
              />
              <YAxis stroke="#8b95a5" fontSize={11} unit={unit} />
              <Tooltip
                labelFormatter={(v) => fmtDateTime(String(v))}
                contentStyle={{ background: "#121923", border: "1px solid #263041", borderRadius: 8 }}
              />
              {th && series === "tilt" && (
                <>
                  <ReferenceLine y={th.tilt_warning} stroke="#e0a100" strokeDasharray="5 4" ifOverflow="extendDomain" />
                  <ReferenceLine y={-th.tilt_warning} stroke="#e0a100" strokeDasharray="5 4" ifOverflow="extendDomain" />
                  <ReferenceLine y={th.tilt_critical} stroke="#d9382f" strokeDasharray="5 4" ifOverflow="extendDomain" />
                  <ReferenceLine y={-th.tilt_critical} stroke="#d9382f" strokeDasharray="5 4" ifOverflow="extendDomain" />
                </>
              )}
              <Legend />
              {keys.map((key, i) => (
                <Line key={key} dataKey={key} name={key.toUpperCase()} stroke={["#4c9ffe", "#f08c4c", "#68d9a1"][i]}
                  dot={data.length < 20} strokeWidth={2} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
