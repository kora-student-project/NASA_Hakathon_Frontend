import { useEffect, useState } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";
import { useI18n, type Key } from "../i18n";

const NASA = "https://gis.earthdata.nasa.gov/portal/rest/services/Landslides/COOLR_Reports_Points/FeatureServer/0";

type Report = {
  geometry: { coordinates: [number, number] } | null;
  properties: { objectid: number; event_title: string | null; event_date: number | string | null };
};

export default function LandslideLayer() {
  const map = useMap();
  const { t, fmtDate } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState<Key | null>("map.landslideLoading");

  useEffect(() => {
    let request: AbortController | undefined;
    async function load() {
      request?.abort();
      setReports([]);
      if (map.getZoom() < 7) {
        setMessage("map.landslideZoom");
        return;
      }
      const current = new AbortController();
      request = current;
      setMessage("map.landslideLoading");
      const params = new URLSearchParams({
        f: "geojson",
        where: "1=1",
        geometry: map.getBounds().toBBoxString(),
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
          setReports(data.features);
          setMessage(data.features.length === 0 ? "map.landslideEmpty" : data.exceededTransferLimit ? "map.landslideLimit" : null);
        }
      } catch {
        if (!current.signal.aborted) setMessage("map.landslideError");
      }
    }
    void load();
    map.on("moveend", load);
    return () => {
      map.off("moveend", load);
      request?.abort();
    };
  }, [map]);

  return (
    <>
      {message && <div className="map-message" role="status">{t(message)}</div>}
      {reports.map(({ geometry, properties }) => {
        if (!geometry) return null;
        const [lon, lat] = geometry.coordinates;
        const date = properties.event_date === null ? null : new Date(properties.event_date);
        return (
          <CircleMarker key={properties.objectid} center={[lat, lon]} radius={6}
            pathOptions={{ color: "#fff0cb", weight: 1, fillColor: "#da8d39", fillOpacity: 0.9 }}>
            <Popup>
              <strong>{properties.event_title || t("map.landslides")}</strong>
              {date && Number.isFinite(date.valueOf()) && <div>{fmtDate(date.toISOString())}</div>}
              <div>NASA COOLR</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
