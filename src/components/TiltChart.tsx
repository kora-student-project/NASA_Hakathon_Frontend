import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { useI18n, type Key } from "../i18n";
import type { Measurement, Sensor, Thresholds } from "../types";

const RANGES: { key: Key; hours: number }[] = [
  { key: "chart.1h", hours: 1 },
  { key: "chart.24h", hours: 24 },
  { key: "chart.7d", hours: 24 * 7 },
  { key: "chart.all", hours: 0 },
];

export default function TiltChart({ objectId, refreshKey }: { objectId: number; refreshKey: number }) {
  const { t, fmtDateTime, fmtTime } = useI18n();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [hours, setHours] = useState(24 * 7);
  const [data, setData] = useState<Measurement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [th, setTh] = useState<Thresholds | null>(null);

  useEffect(() => {
    api.thresholds().then(setTh).catch(() => setTh(null));
  }, []);

  useEffect(() => {
    setSensors([]);
    setSensorId(null);
    setData([]);
    api
      .sensors(objectId)
      .then((s) => {
        setSensors(s);
        setSensorId(s[0]?.id ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, [objectId]);

  useEffect(() => {
    if (sensorId == null) return;
    const from = hours ? new Date(Date.now() - hours * 3600_000).toISOString() : null;
    api
      .history(sensorId, from)
      .then((rows) => {
        setData([...rows].reverse());
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [sensorId, hours, refreshKey]);

  return (
    <section className="card">
      <div className="row">
        <h3>{t("chart.title")}</h3>
        <div className="controls">
          {sensors.length > 1 && (
            <select value={sensorId ?? ""} onChange={(e) => setSensorId(Number(e.target.value))}>
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.key} value={r.hours}>
                {t(r.key)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {sensors.length === 0 && <p className="muted">{t("chart.noSensors")}</p>}
      {sensors.length > 0 && data.length === 0 && !error && <p className="muted">{t("chart.noData")}</p>}
      {data.length > 0 && (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3a" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v: string) => fmtTime(v)}
                stroke="#8b95a5"
                fontSize={11}
              />
              <YAxis stroke="#8b95a5" fontSize={11} unit="°" />
              <Tooltip
                labelFormatter={(v) => fmtDateTime(String(v))}
                contentStyle={{ background: "#121923", border: "1px solid #263041", borderRadius: 8 }}
              />
              {th && (
                <>
                  <ReferenceLine y={th.tilt_warning} stroke="#e0a100" strokeDasharray="5 4" />
                  <ReferenceLine y={-th.tilt_warning} stroke="#e0a100" strokeDasharray="5 4" />
                  <ReferenceLine y={th.tilt_critical} stroke="#d9382f" strokeDasharray="5 4" />
                  <ReferenceLine y={-th.tilt_critical} stroke="#d9382f" strokeDasharray="5 4" />
                </>
              )}
              <Legend />
              <Line type="monotone" dataKey="tilt_x" name="X" stroke="#4c9ffe" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="tilt_y" name="Y" stroke="#f08c4c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
