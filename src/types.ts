export type Status = "UNKNOWN" | "NORMAL" | "WARNING" | "CRITICAL";

export interface MonitoredObject {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ObjectStatus {
  object_id: number;
  status: Status;
  latest_sensor_data: {
    sensor_id: number;
    tilt_x: number;
    tilt_y: number;
    temperature: number | null;
    timestamp: string;
  } | null;
  latest_satellite_data: { displacement: number; unit: string; observation_date: string } | null;
  active_alerts: number;
  last_updated: string | null;
}

export interface Sensor {
  id: number;
  object_id: number;
  name: string;
  sensor_type: string;
}

export interface Measurement {
  id: number;
  sensor_id: number;
  tilt_x: number;
  tilt_y: number;
  temperature: number | null;
  timestamp: string;
}

export interface Alert {
  id: number;
  object_id: number;
  sensor_id: number | null;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
  message: string;
  created_at: string;
  is_resolved: boolean;
}

export interface SatelliteFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: number[] };
  properties: {
    id: number;
    object_id: number;
    displacement: number;
    unit: string;
    observation_date: string;
    source: string;
  };
}

export interface SatelliteCollection {
  type: "FeatureCollection";
  features: SatelliteFeature[];
}
