import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { useI18n } from "../i18n";

// Публічний шар NASA GIBS: NISAR L2 GCOV, нормалізоване радіолокаційне розсіювання (хибні кольори).
// Тайли щоденні: кожна ділянка знімається приблизно раз на 12 діб, тож більшість днів порожні.
const LAYER = "NISAR_L2_Geocoded_Polarimetric_Covariance";
const GIBS = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LAYER}/default`;
export const NISAR_MIN_DATE = "2025-10-29";
const EMPTY_TILE_BYTES = 1500; // порожній тайл ≈ 288 байт
const LOOKBACK_DAYS = 30;
const PROBE_ZOOM = 9;

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const out = d.toISOString().slice(0, 10);
  return out < NISAR_MIN_DATE ? NISAR_MIN_DATE : out > todayUtc() ? todayUtc() : out;
}

function tileXY(lat: number, lon: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
  return { x, y };
}

const tileUrl = (date: string, z: number, y: number, x: number) =>
  `${GIBS}/${date}/GoogleMapsCompatible_Level13/${z}/${y}/${x}.png`;

/** Шукає найсвіжішу дату, коли NISAR знімав це місце (перевіряє тайл навколо точки). */
export function useLatestNisarDate(lat: number, lon: number, enabled: boolean) {
  const [state, setState] = useState<{ date: string | null; searching: boolean; done: boolean }>({
    date: null,
    searching: false,
    done: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ date: null, searching: true, done: false });
    (async () => {
      const { x, y } = tileXY(lat, lon, PROBE_ZOOM);
      let day = todayUtc();
      for (let i = 0; i < LOOKBACK_DAYS && day >= NISAR_MIN_DATE; i++) {
        try {
          const res = await fetch(tileUrl(day, PROBE_ZOOM, y, x), { signal: controller.signal });
          if (res.ok && (await res.blob()).size > EMPTY_TILE_BYTES) {
            setState({ date: day, searching: false, done: true });
            return;
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        day = shiftDate(day, -1);
      }
      if (!controller.signal.aborted) setState({ date: null, searching: false, done: true });
    })();
    return () => controller.abort();
  }, [lat, lon, enabled, attempt]);

  return { ...state, search: () => setAttempt((n) => n + 1) };
}

export default function NisarLayer({ date }: { date: string }) {
  return (
    <TileLayer
      key={date}
      url={`${GIBS}/${date}/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`}
      attribution='NASA GIBS · NISAR'
      maxNativeZoom={13}
      maxZoom={19}
      opacity={0.8}
      zIndex={250}
    />
  );
}

export function NisarControls({ date, setDate, searching, onLatest }: {
  date: string;
  setDate: (d: string) => void;
  searching: boolean;
  onLatest: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="nisar-controls">
      <button type="button" className="btn small-btn" aria-label={t("map.nisarPrev")} title={t("map.nisarPrev")}
        onClick={() => setDate(shiftDate(date, -1))}>‹</button>
      <input type="date" aria-label={t("map.nisarDate")} value={date} min={NISAR_MIN_DATE} max={todayUtc()}
        onChange={(e) => e.target.value && setDate(e.target.value)} />
      <button type="button" className="btn small-btn" aria-label={t("map.nisarNext")} title={t("map.nisarNext")}
        onClick={() => setDate(shiftDate(date, 1))}>›</button>
      <button type="button" className="btn small-btn" onClick={onLatest} disabled={searching}>
        {searching ? t("map.nisarSearching") : t("map.nisarLatest")}
      </button>
    </div>
  );
}

export function NisarLegend({ foundNone }: { foundNone: boolean }) {
  const { t } = useI18n();
  return (
    <div className="nisar-legend">
      <span>{t("map.nisarNote")}</span>
      {foundNone && <strong>{t("map.nisarNone")}</strong>}
      <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noreferrer">{t("map.nisarLegend")} ↗</a>
    </div>
  );
}
