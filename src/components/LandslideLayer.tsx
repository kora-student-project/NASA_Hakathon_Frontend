import { canvas, type LatLngBounds } from "leaflet";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";
import { useI18n, type Key } from "../i18n";

const NASA = "https://gis.earthdata.nasa.gov/portal/rest/services/Landslides/COOLR_Reports_Points/FeatureServer/0";
const DEBOUNCE_MS = 400;
const PAD = 0.5; // запит із запасом по краях: невеликі зсуви карти не потребують нового запиту

type Report = {
  geometry: { coordinates: [number, number] } | null;
  properties: { objectid: number; event_title: string | null; event_date: number | string | null };
};

export default function LandslideLayer() {
  const map = useMap();
  const { t, fmtDate } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState<Key | null>("map.landslideLoading");
  // Сотні маркерів малюємо на одному <canvas>, а не сотнями SVG-вузлів: набагато швидше при русі карти
  const renderer = useMemo(() => canvas({ padding: 0.5 }), []);
  const loaded = useRef<{ covers: LatLngBounds; zoom: number } | null>(null); // що вже завантажено

  useEffect(() => {
    let request: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      if (map.getZoom() < 7) {
        request?.abort();
        loaded.current = null;
        setReports([]);
        setMessage("map.landslideZoom");
        return;
      }
      // Видима ділянка вже покрита попереднім запитом того самого масштабу: нічого вантажити
      const have = loaded.current;
      if (have && have.zoom === map.getZoom() && have.covers.contains(map.getBounds())) return;
      request?.abort();
      const covers = map.getBounds().pad(PAD);
      const current = new AbortController();
      request = current;
      setMessage("map.landslideLoading"); // старі маркери лишаються видимими, поки приходять нові
      const params = new URLSearchParams({
        f: "geojson",
        where: "1=1",
        geometry: covers.toBBoxString(),
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        outSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outFields: "objectid,event_title,event_date",
        resultRecordCount: "500",
        orderByFields: "event_date DESC",
      });
      try {
        const response = await fetch(`${NASA}/query?${params}`, { signal: current.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json() as { features?: Report[]; exceededTransferLimit?: boolean };
        if (!Array.isArray(data.features)) throw new Error("Invalid NASA response");
        if (!current.signal.aborted) {
          loaded.current = { covers, zoom: map.getZoom() };
          setReports(data.features);
          setMessage(data.features.length === 0 ? "map.landslideEmpty" : data.exceededTransferLimit ? "map.landslideLimit" : null);
        }
      } catch {
        if (!current.signal.aborted) setMessage("map.landslideError");
      }
    }

    const schedule = () => { clearTimeout(timer); timer = setTimeout(load, DEBOUNCE_MS); };
    void load();
    map.on("moveend", schedule);
    return () => {
      clearTimeout(timer);
      map.off("moveend", schedule);
      request?.abort();
    };
  }, [map]);

  return (
    <>
      {message && <div className="map-message" role="status">{t(message)}</div>}
      <Markers reports={reports} renderer={renderer} title={t("map.landslides")} fmtDate={fmtDate} />
    </>
  );
}

// Окремий мемоізований компонент: маркери не перемальовуються, коли змінюється лише повідомлення про стан
const Markers = memo(function Markers({ reports, renderer, title, fmtDate }: {
  reports: Report[];
  renderer: ReturnType<typeof canvas>;
  title: string;
  fmtDate: (iso: string) => string;
}) {
  return (
    <>
      {reports.map(({ geometry, properties }) => {
        if (!geometry) return null;
        const [lon, lat] = geometry.coordinates;
        const date = properties.event_date === null ? null : new Date(properties.event_date);
        return (
          <CircleMarker key={properties.objectid} center={[lat, lon]} radius={6} renderer={renderer}
            pathOptions={{ color: "#fff0cb", weight: 1, fillColor: "#da8d39", fillOpacity: 0.9 }}>
            <Popup>
              <strong>{properties.event_title || title}</strong>
              {date && Number.isFinite(date.valueOf()) && <div>{fmtDate(date.toISOString())}</div>}
              <div>NASA COOLR</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
});
