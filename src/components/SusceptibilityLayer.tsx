import { CRS, latLng, latLngBounds, type LatLngBounds, type Map } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { ImageOverlay, useMap } from "react-leaflet";
import { useI18n } from "../i18n";

const NASA = "https://gis.earthdata.nasa.gov/portal/rest/services/Landslides/Global_Landslide_Susceptibility/ImageServer";
const COLORS = [
  [45, 74, 100], [53, 159, 132], [145, 185, 103],
  [250, 194, 72], [232, 118, 64], [189, 47, 82],
];
const RENDERING_RULE = JSON.stringify({
  rasterFunction: "Colormap",
  rasterFunctionArguments: { Colormap: COLORS.map((color, value) => [value, ...color]) },
});

const PAD = 0.5; // запит із запасом по краях (інерція перетягування зсуває карту далеко): зсуви в межах запасу не потребують нового зображення
const MAX_PX = 1100;
const DEBOUNCE_MS = 350;

interface Overlay {
  url: string;
  bounds: [[number, number], [number, number]];
  covers: LatLngBounds; // що саме покриває зображення (у координатах карти)
  zoom: number;
}

function viewportImage(map: Map): Overlay | null {
  const viewport = map.getBounds().pad(PAD);
  const shift = Math.floor((map.getCenter().lng + 180) / 360) * 360;
  const west = Math.max(viewport.getWest() - shift, -180);
  const east = Math.min(viewport.getEast() - shift, 180);
  const south = Math.max(viewport.getSouth(), -60.00827333);
  const north = Math.min(viewport.getNorth(), 72.00006);
  if (east <= west || north <= south) return null;

  // Export in Leaflet's projection. Keep the class values intact during resampling.
  const sw = CRS.EPSG3857.project(latLng(south, west));
  const ne = CRS.EPSG3857.project(latLng(north, east));
  const size = map.getSize();
  const w = size.x * (1 + 2 * PAD);
  const h = size.y * (1 + 2 * PAD);
  const scale = Math.min(1, MAX_PX / Math.max(w, h));
  const params = new URLSearchParams({
    bbox: [sw.x, sw.y, ne.x, ne.y].map((n) => n.toFixed(2)).join(","),
    bboxSR: "3857",
    imageSR: "3857",
    size: `${Math.max(1, Math.round(w * scale))},${Math.max(1, Math.round(h * scale))}`,
    adjustAspectRatio: "false",
    interpolation: "RSP_NearestNeighbor",
    renderingRule: RENDERING_RULE,
    format: "png32", // png8 не дає виграшу (той самий розмір) і губить прозорість
    f: "image",
  });
  const bounds: Overlay["bounds"] = [[south, west + shift], [north, east + shift]];
  return { url: `${NASA}/exportImage?${params}`, bounds, covers: latLngBounds(bounds), zoom: map.getZoom() };
}

export default function SusceptibilityLayer() {
  const map = useMap();
  const { t } = useI18n();
  const [shown, setShown] = useState<Overlay | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "coverage">("loading");
  const current = useRef<Overlay | null>(null);
  const token = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      // Нове зображення не потрібне, якщо поточне того самого масштабу вже покриває видиму ділянку
      const have = current.current;
      if (have && have.zoom === map.getZoom() && have.covers.contains(map.getBounds())) return;
      const next = viewportImage(map);
      if (!next) { setState("coverage"); return; }
      const mine = ++token.current;
      setState("loading");
      // Спочатку підвантажуємо у фоні й лише потім підміняємо: стара картинка не зникає під час завантаження
      const img = new Image();
      img.onload = () => {
        if (mine !== token.current) return; // застаріла відповідь
        current.current = next;
        setShown(next);
        setState("ready");
      };
      img.onerror = () => { if (mine === token.current) setState("error"); };
      img.src = next.url;
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(update, DEBOUNCE_MS); };

    update();
    map.on("moveend", schedule);
    return () => {
      clearTimeout(timer);
      token.current++;
      map.off("moveend", schedule);
    };
  }, [map]);

  return (
    <>
      {shown && (
        <ImageOverlay
          key={shown.url}
          url={shown.url}
          bounds={shown.bounds}
          className="susceptibility-image"
          opacity={0.62}
          attribution="NASA Global Landslide Susceptibility"
        />
      )}
      {state === "coverage" && <div className="map-message" role="status">{t("map.susceptibilityCoverage")}</div>}
      {state === "error" && <div className="map-message" role="status">{t("map.susceptibilityError")}</div>}
      {state === "loading" && <div className="map-message" role="status">{t("map.susceptibilityLoading")}</div>}
    </>
  );
}

export function SusceptibilityLegend() {
  const { t } = useI18n();
  return (
    <div className="susceptibility-legend">
      <div className="susceptibility-scale" aria-label={t("map.susceptibilityScale")}>
        <span>{t("map.susceptibilityLow")}</span>
        {COLORS.map((color, value) => (
          <span key={value} data-value={value} className="susceptibility-swatch" style={{ backgroundColor: `rgb(${color.join(",")})` }}>
            {value}
          </span>
        ))}
        <span>{t("map.susceptibilityHigh")}</span>
      </div>
      <a href={NASA} target="_blank" rel="noreferrer">{t("map.susceptibilitySource")} ↗</a>
    </div>
  );
}
