import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { STATUS_COLOR, fmtDate } from "../format";
import type { MonitoredObject, ObjectStatus, SatelliteCollection } from "../types";

function FlyTo({ obj }: { obj: MonitoredObject | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (obj) map.flyTo([obj.latitude, obj.longitude], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [obj?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface Props {
  objects: MonitoredObject[];
  statuses: Record<number, ObjectStatus>;
  satellite: SatelliteCollection | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  showSatellite: boolean;
}

export default function MapView({ objects, statuses, satellite, selectedId, onSelect, showSatellite }: Props) {
  const selected = objects.find((o) => o.id === selectedId);
  return (
    <MapContainer center={[49.8397, 24.0297]} zoom={12} className="map">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FlyTo obj={selected} />

      {showSatellite &&
        satellite?.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const p = f.properties;
          return (
            <CircleMarker
              key={`sat-${p.id}`}
              center={[lat, lon]}
              radius={5}
              pathOptions={{ color: "#5b4bd6", fillColor: "#7b6cf0", fillOpacity: 0.7, weight: 1 }}
            >
              <Popup>
                <b>Супутник ({p.source})</b>
                <br />
                Зміщення: {p.displacement} {p.unit}
                <br />
                Дата: {fmtDate(p.observation_date)}
              </Popup>
            </CircleMarker>
          );
        })}

      {objects.map((o) => {
        const st = statuses[o.id]?.status ?? "UNKNOWN";
        return (
          <CircleMarker
            key={o.id}
            center={[o.latitude, o.longitude]}
            radius={o.id === selectedId ? 13 : 10}
            pathOptions={{ color: "#fff", weight: 2, fillColor: STATUS_COLOR[st], fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(o.id) }}
          >
            <Popup>{o.name}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
