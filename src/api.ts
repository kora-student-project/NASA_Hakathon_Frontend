import type {
  Alert,
  Measurement,
  MonitoredObject,
  ObjectStatus,
  SatelliteCollection,
  Sensor,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  objects: () => request<MonitoredObject[]>("/api/objects?limit=500"),
  status: (id: number) => request<ObjectStatus>(`/api/objects/${id}/status`),
  sensors: (objectId: number) => request<Sensor[]>(`/api/sensors?object_id=${objectId}`),
  history: (sensorId: number, fromIso: string | null, limit = 500) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (fromIso) q.set("from", fromIso);
    return request<Measurement[]>(`/api/sensors/${sensorId}/data?${q}`);
  },
  satelliteMap: () => request<SatelliteCollection>("/api/satellite/map?limit=1000"),
  alerts: (resolved: boolean | null, limit = 100) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (resolved !== null) q.set("is_resolved", String(resolved));
    return request<Alert[]>(`/api/alerts?${q}`);
  },
  resolveAlert: (id: number, adminKey: string) =>
    request<Alert>(`/api/alerts/${id}/resolve`, {
      method: "PATCH",
      headers: { "X-API-Key": adminKey },
    }),
};
