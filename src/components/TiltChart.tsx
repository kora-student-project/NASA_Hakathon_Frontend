import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import type { Measurement, Sensor } from "../types";

const RANGES = [
  { label: "1 год", hours: 1 },
  { label: "24 год", hours: 24 },
  { label: "7 днів", hours: 24 * 7 },
  { label: "Усе", hours: 0 },
];

export default function TiltChart({ objectId, refreshKey }: { objectId: number; refreshKey: number }) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [hours, setHours] = useState(24 * 7);
  const [data, setData] = useState<Measurement[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        <h3>Нахил конструкції</h3>
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
              <option key={r.label} value={r.hours}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {sensors.length === 0 && <p className="muted">До об'єкта не прив'язано датчиків.</p>}
      {sensors.length > 0 && data.length === 0 && !error && <p className="muted">Немає вимірювань за цей період.</p>}
      {data.length > 0 && (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t: string) => new Date(t).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                stroke="#8b95a5"
                fontSize={11}
              />
              <YAxis stroke="#8b95a5" fontSize={11} unit="°" />
              <Tooltip
                labelFormatter={(t) => new Date(String(t)).toLocaleString("uk-UA")}
                contentStyle={{ background: "#151b26", border: "1px solid #2a3342" }}
              />
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
