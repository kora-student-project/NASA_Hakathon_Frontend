import type {
  Alert,
  Measurement,
  MonitoredObject,
  ObjectStatus,
  SatelliteCollection,
  Sensor,
  Thresholds,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(12_000);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  const res = await fetch(`${BASE}${path}`, { ...init, signal });
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

interface AlertQuery {
  resolved?: boolean;
  objectId?: number;
  severity?: Alert["severity"];
  limit?: number;
}

export const api = {
  thresholds: (signal?: AbortSignal) => request<Thresholds>("/api/thresholds", { signal }),
  objects: (signal?: AbortSignal) => request<MonitoredObject[]>("/api/objects?limit=500", { signal }),
  status: (id: number, signal?: AbortSignal) => request<ObjectStatus>(`/api/objects/${id}/status`, { signal }),
  sensors: (objectId: number, signal?: AbortSignal) => request<Sensor[]>(`/api/sensors?object_id=${objectId}`, { signal }),
  history: (sensorId: number, fromIso: string | null, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: "500" });
    if (fromIso) q.set("from", fromIso);
    return request<Measurement[]>(`/api/sensors/${sensorId}/data?${q}`, { signal });
  },
  satelliteMap: (objectId?: number, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: "1000" });
    if (objectId !== undefined) q.set("object_id", String(objectId));
    return request<SatelliteCollection>(`/api/satellite/map?${q}`, { signal });
  },
  alerts: ({ resolved, objectId, severity, limit = 100 }: AlertQuery, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (resolved !== undefined) q.set("is_resolved", String(resolved));
    if (objectId !== undefined) q.set("object_id", String(objectId));
    if (severity) q.set("severity", severity);
    return request<Alert[]>(`/api/alerts?${q}`, { signal });
  },
  resolveAlert: (id: number, adminKey: string) =>
    request<Alert>(`/api/alerts/${id}/resolve`, {
      method: "PATCH",
      headers: { "X-API-Key": adminKey },
    }),
};
