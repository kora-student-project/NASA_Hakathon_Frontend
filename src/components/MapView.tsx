import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { STATUS_COLOR } from "../format";
import { useI18n } from "../i18n";
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
  const { t, fmtDate } = useI18n();
  const selected = objects.find((o) => o.id === selectedId);
  return (
    <MapContainer center={[49.8397, 24.0297]} zoom={12} className="map">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        maxZoom={19}
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
              pathOptions={{ color: "#a99bff", fillColor: "#7b6cf0", fillOpacity: 0.8, weight: 1 }}
            >
              <Popup>
                <b>{t("map.satellite", { source: p.source })}</b>
                <br />
                {t("map.displacement")}: {p.displacement} {p.unit}
                <br />
                {t("map.date")}: {fmtDate(p.observation_date)}
              </Popup>
            </CircleMarker>
          );
        })}

      {objects.map((o) => {
        const st = statuses[o.id]?.status ?? "UNKNOWN";
        const color = STATUS_COLOR[st];
        return (
          <CircleMarker
            key={o.id}
            center={[o.latitude, o.longitude]}
            radius={o.id === selectedId ? 13 : 10}
            className={st === "CRITICAL" ? "pulse" : undefined}
            pathOptions={{ color: st === "CRITICAL" ? color : "#ffffff", weight: 2, fillColor: color, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(o.id) }}
          >
            <Popup>{o.name}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
