import { CRS, latLng, type LatLngBoundsExpression, type Map } from "leaflet";
import { useEffect, useState } from "react";
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

function viewportImage(map: Map) {
  const viewport = map.getBounds();
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
  const bounds: LatLngBoundsExpression = [[south, west + shift], [north, east + shift]];
  return { url: `${NASA}/exportImage?${params}`, bounds };
}

export default function SusceptibilityLayer() {
  const map = useMap();
  const { t } = useI18n();
  const [image, setImage] = useState(() => viewportImage(map));
  const [result, setResult] = useState<{ url: string; loaded: boolean } | null>(null);

  useEffect(() => {
    const update = () => setImage(viewportImage(map));
    map.on("moveend", update);
    return () => { map.off("moveend", update); };
  }, [map]);

  if (!image) return <div className="map-message" role="status">{t("map.susceptibilityCoverage")}</div>;

  const loaded = result?.url === image.url ? result.loaded : undefined;
  return (
    <>
      <ImageOverlay
        key={image.url}
        url={image.url}
        bounds={image.bounds}
        className="susceptibility-image"
        opacity={0.62}
        attribution="NASA Global Landslide Susceptibility"
        eventHandlers={{
          load: () => setResult({ url: image.url, loaded: true }),
          error: () => setResult({ url: image.url, loaded: false }),
        }}
      />
      {loaded !== true && (
        <div className="map-message" role="status">
          {t(loaded === false ? "map.susceptibilityError" : "map.susceptibilityLoading")}
        </div>
      )}
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
