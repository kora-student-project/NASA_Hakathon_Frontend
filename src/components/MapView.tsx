import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { BASEMAPS, loadBasemap, saveBasemap, type BasemapId } from "../basemaps";
import { STATUS_COLOR } from "../format";
import { useI18n } from "../i18n";
import { displayStatus, isStale } from "../objectStatuses";
import type { Source } from "../polling";
import type { MonitoredObject, ObjectStatus, SatelliteCollection } from "../types";
import LandslideLayer from "./LandslideLayer";
import NisarLayer, { NisarControls, NisarLegend, todayUtc, useLatestNisarDate } from "./NisarLayer";
import SourceRefresh from "./SourceRefresh";
import SusceptibilityLayer, { SusceptibilityLegend } from "./SusceptibilityLayer";

function MapEffects({ obj }: { obj: MonitoredObject | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (obj) map.flyTo([obj.latitude, obj.longitude], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [obj?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false, debounceMoveend: true }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

interface Props {
  objects: MonitoredObject[];
  statuses: Record<number, Source<ObjectStatus>>;
  satellite: Source<SatelliteCollection>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function MapView({ objects, statuses, satellite, selectedId, onSelect }: Props) {
  const { t, fmtDate } = useI18n();
  const [basemapId, setBasemapId] = useState<BasemapId>(loadBasemap);
  const basemap = BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS[0];
  const [showSatellite, setShowSatellite] = useState(true);
  const [showLandslides, setShowLandslides] = useState(false);
  const [showSusceptibility, setShowSusceptibility] = useState(false);
  const [showNisar, setShowNisar] = useState(false);
  const [nisarDate, setNisarDate] = useState(todayUtc());
  const selected = objects.find((o) => o.id === selectedId);
  const probe = selected ?? objects[0];
  const latest = useLatestNisarDate(probe?.latitude ?? 49.8397, probe?.longitude ?? 24.0297, showNisar);
  const [userPicked, setUserPicked] = useState(false);
  useEffect(() => { if (latest.date && !userPicked) setNisarDate(latest.date); }, [latest.date, userPicked]);
  // Не вантажимо порожні тайли сьогоднішньої дати, поки шукаємо найсвіжіший проліт
  const nisarVisible = showNisar && (userPicked || !latest.searching);
  const objectPositions = new Set(objects.map((o) => `${o.latitude},${o.longitude}`));
  return (
    <div className="map-frame">
      <div className="map-controls">
        <label className="field">
          <span className="label">{t("map.basemap")}</span>
          <select value={basemapId} onChange={(e) => { const id = e.target.value as BasemapId; setBasemapId(id); saveBasemap(id); }}>
            {BASEMAPS.map((b) => <option key={b.id} value={b.id}>{t(b.label)}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={showSatellite}
          onChange={(e) => setShowSatellite(e.target.checked)} />{t("map.observations")}</label>
        <label className="check"><input type="checkbox" checked={showNisar}
          onChange={(e) => setShowNisar(e.target.checked)} />{t("map.nisar")}</label>
        <label className="check"><input type="checkbox" checked={showLandslides}
          onChange={(e) => setShowLandslides(e.target.checked)} />{t("map.landslides")}</label>
        <label className="check"><input type="checkbox" checked={showSusceptibility}
          onChange={(e) => setShowSusceptibility(e.target.checked)} />{t("map.susceptibility")}</label>
        {showNisar && (
          <NisarControls
            date={nisarDate}
            setDate={(d) => { setUserPicked(true); setNisarDate(d); }}
            searching={latest.searching}
            onLatest={() => { setUserPicked(false); latest.search(); }}
          />
        )}
      </div>
      <MapContainer center={[49.8397, 24.0297]} zoom={12} className="map">
      <TileLayer key={basemap.id} url={basemap.url} attribution={basemap.attribution}
        maxNativeZoom={basemap.maxNativeZoom} maxZoom={19} updateWhenZooming={false} />
      {basemap.labelsUrl && (
        <TileLayer key={`${basemap.id}-labels`} url={basemap.labelsUrl} attribution=""
          maxNativeZoom={basemap.labelsMaxNativeZoom ?? 19} maxZoom={19} zIndex={300} updateWhenZooming={false} />
      )}
      <MapEffects obj={selected} />
      {nisarVisible && <NisarLayer date={nisarDate} />}
      {(showLandslides || showSusceptibility) && (
        <div className="map-messages">
          {showSusceptibility && <SusceptibilityLayer />}
          {showLandslides && <LandslideLayer />}
        </div>
      )}

      {showSatellite &&
        [...(satellite.data?.features ?? [])].reverse().map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          const p = f.properties;
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
          const color = STATUS_COLOR[p.severity] ?? "#a99bff"; // severity рахує бекенд
          const overlapsObject = objectPositions.has(`${lat},${lon}`);
          return (
            <CircleMarker
              key={`sat-${p.id}`}
              center={[lat, lon]}
              radius={overlapsObject ? 18 : 6}
              pathOptions={{ color, fill: !overlapsObject, fillColor: color, fillOpacity: 0.85, weight: 3, dashArray: "2 2" }}
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
        const st = displayStatus(statuses[o.id]);
        const stale = isStale(statuses[o.id]);
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
            <Popup>
              <strong>{o.name}</strong>
              <br />
              {t(`status.${st}`)}{stale ? ` · ${t("map.statusStale")}` : ""}
            </Popup>
          </CircleMarker>
        );
      })}
      </MapContainer>
      <div className="map-legend">
        {showSatellite && (
          <>
            <SourceRefresh source={satellite} label="map.observations" />
            {satellite.data && <span>{t("map.thresholdLegend")}</span>}
          </>
        )}
        {showLandslides && <a href="https://gpm.nasa.gov/applications/landslides/coolr" target="_blank" rel="noreferrer">
          {t("map.landslideLegend")} ↗
        </a>}
      </div>
      {showNisar && <NisarLegend foundNone={latest.done && latest.date === null} />}
      {showSusceptibility && <SusceptibilityLegend />}
    </div>
  );
}
