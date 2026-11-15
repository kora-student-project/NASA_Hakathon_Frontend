import type { Key } from "./i18n";

// Безкоштовні підкладки без ключів (OpenStreetMap та Esri). maxNativeZoom — до якого масштабу є реальні тайли
// (далі Leaflet збільшує останній рівень), перевірено над Львовом.
export type BasemapId = "streets" | "satellite" | "hybrid" | "topo" | "terrain" | "light" | "dark";

export interface Basemap {
  id: BasemapId;
  label: Key;
  url: string;
  attribution: string;
  maxNativeZoom: number;
  labelsUrl?: string; // прозорий шар підписів (назви міст, кордони) поверх
  labelsMaxNativeZoom?: number;
}

const esri = (service: string) => `https://services.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;
const ESRI = "Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community";
const PLACES = esri("Reference/World_Boundaries_and_Places");

export const BASEMAPS: Basemap[] = [
  { id: "streets", label: "map.streets", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors", maxNativeZoom: 19 },
  { id: "satellite", label: "map.imagery", url: esri("World_Imagery"), attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community", maxNativeZoom: 19 },
  { id: "hybrid", label: "map.hybrid", url: esri("World_Imagery"), attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community", maxNativeZoom: 19, labelsUrl: PLACES, labelsMaxNativeZoom: 19 },
  { id: "topo", label: "map.topo", url: esri("World_Topo_Map"), attribution: ESRI, maxNativeZoom: 17 },
  { id: "terrain", label: "map.terrain", url: esri("World_Shaded_Relief"), attribution: ESRI, maxNativeZoom: 13, labelsUrl: PLACES, labelsMaxNativeZoom: 19 },
  { id: "light", label: "map.light", url: esri("Canvas/World_Light_Gray_Base"), attribution: ESRI, maxNativeZoom: 16, labelsUrl: esri("Canvas/World_Light_Gray_Reference"), labelsMaxNativeZoom: 16 },
  { id: "dark", label: "map.dark", url: esri("Canvas/World_Dark_Gray_Base"), attribution: ESRI, maxNativeZoom: 16, labelsUrl: esri("Canvas/World_Dark_Gray_Reference"), labelsMaxNativeZoom: 16 },
];

const STORAGE_KEY = "kora.basemap";

export function loadBasemap(): BasemapId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (BASEMAPS.some((b) => b.id === saved)) return saved as BasemapId;
  } catch {
    /* сховище недоступне */
  }
  return "streets";
}

export function saveBasemap(id: BasemapId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
