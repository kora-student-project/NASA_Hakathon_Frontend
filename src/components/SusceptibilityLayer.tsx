import { CRS, latLngBounds, type LatLngBounds, type LatLngBoundsExpression, type Map } from "leaflet";
import { useEffect, useState } from "react";
import { ImageOverlay, Pane, useMap } from "react-leaflet";
import ukraineRasterUrl from "../assets/nasa-susceptibility-ukraine.png";
import { useI18n } from "../i18n";

const NASA = "https://gis.earthdata.nasa.gov/portal/rest/services/Landslides/Global_Landslide_Susceptibility/ImageServer";
// Web Mercator crop of NASA's 2023 raster, covering Ukraine and its immediate surroundings.
const UKRAINE_RASTER = latLngBounds([43, 20], [54, 42]);
const COLORS = [
  [45, 74, 100], [53, 159, 132], [145, 185, 103],
  [250, 194, 72], [232, 118, 64], [189, 47, 82],
];
const RENDERING_RULE = JSON.stringify({
  rasterFunction: "Colormap",
  rasterFunctionArguments: { Colormap: COLORS.map((color, value) => [value, ...color]) },
});

function shiftedBounds(bounds: LatLngBounds, shift: number): LatLngBoundsExpression {
  return [
    [bounds.getSouth(), bounds.getWest() + shift],
    [bounds.getNorth(), bounds.getEast() + shift],
  ];
}

function viewportLayers(map: Map) {
  const viewport = map.getBounds();
  const shift = Math.floor((map.getCenter().lng + 180) / 360) * 360;
  const west = Math.max(viewport.getWest() - shift, -180);
  const east = Math.min(viewport.getEast() - shift, 180);
  const south = Math.max(viewport.getSouth(), -60.00827333);
  const north = Math.min(viewport.getNorth(), 72.00006);
  if (east <= west || north <= south) return null;

  const bounds = latLngBounds([south, west], [north, east]);
  const regional = UKRAINE_RASTER.overlaps(bounds) ? shiftedBounds(UKRAINE_RASTER, shift) : null;
  if (UKRAINE_RASTER.contains(bounds)) return { regional, remote: null };

  // Export in Leaflet's projection. Keep the class values intact during resampling.
  const sw = CRS.EPSG3857.project(bounds.getSouthWest());
  const ne = CRS.EPSG3857.project(bounds.getNorthEast());
  const size = map.getSize();
  const scale = Math.min(1, 1200 / Math.max(size.x, size.y));
  const params = new URLSearchParams({
    bbox: [sw.x, sw.y, ne.x, ne.y].map((n) => n.toFixed(2)).join(","),
    bboxSR: "3857",
    imageSR: "3857",
    size: `${Math.max(1, Math.round(size.x * scale))},${Math.max(1, Math.round(size.y * scale))}`,
    adjustAspectRatio: "false",
    interpolation: "RSP_NearestNeighbor",
    renderingRule: RENDERING_RULE,
    format: "png32",
    f: "image",
  });
  return { regional, remote: { url: `${NASA}/exportImage?${params}`, bounds: shiftedBounds(bounds, shift) } };
}

// ImageServer can return a valid PNG with every pixel marked NoData.
function hasRasterData(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return true;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let alpha = 3; alpha < data.length; alpha += 4) {
    if (data[alpha] > 0) return true;
  }
  return false;
}

export default function SusceptibilityLayer() {
  const map = useMap();
  const { t } = useI18n();
  const [layers, setLayers] = useState(() => viewportLayers(map));
  const [result, setResult] = useState<{ url: string; state: "ready" | "empty" | "error" } | null>(null);

  useEffect(() => {
    const update = () => setLayers(viewportLayers(map));
    map.on("moveend", update);
    return () => { map.off("moveend", update); };
  }, [map]);

  if (!layers) return <div className="map-message" role="status">{t("map.susceptibilityCoverage")}</div>;

  const { regional, remote } = layers;
  const state = result?.url === remote?.url ? result?.state : undefined;
  let message: string | undefined;
  if (remote && state !== "ready") {
    if (!state) message = t("map.susceptibilityLoading");
    else if (regional) message = t("map.susceptibilityRegionalOnly");
    else message = t(state === "empty" ? "map.susceptibilityNoData" : "map.susceptibilityError");
  }
  return (
    <>
      <Pane name="susceptibility" style={{ zIndex: 350, opacity: 0.62 }}>
        {remote && (
          <ImageOverlay
            key={remote.url}
            url={remote.url}
            bounds={remote.bounds}
            className="susceptibility-image"
            crossOrigin="anonymous"
            attribution="NASA Global Landslide Susceptibility"
            eventHandlers={{
              load: (event) => {
                const image: HTMLImageElement = event.target.getElement();
                setResult({ url: remote.url, state: hasRasterData(image) ? "ready" : "empty" });
              },
              error: () => setResult({ url: remote.url, state: "error" }),
            }}
          />
        )}
        {regional && (
          <ImageOverlay
            url={ukraineRasterUrl}
            bounds={regional}
            zIndex={2}
            className="susceptibility-image"
            attribution="NASA Global Landslide Susceptibility"
          />
        )}
      </Pane>
      {message && <div className="map-message" role="status">{message}</div>}
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
