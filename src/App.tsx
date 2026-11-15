import { Fragment, Suspense, lazy, useCallback, useState } from "react";
import { api } from "./api";
import AlertsList from "./components/AlertsList";
import LangSwitch from "./components/LangSwitch";
import { useI18n } from "./i18n";
import MapView from "./components/MapView";
import ObjectPanel from "./components/ObjectPanel";
import SourceRefresh from "./components/SourceRefresh";
import StatusBadge from "./components/StatusBadge";
import { displayStatus, useObjectStatuses } from "./objectStatuses";
import { EMPTY_SOURCE, usePolling } from "./polling";

// Графіки (Recharts) — найважча залежність: вантажимо їх окремим чанком лише коли вибрано об'єкт.
const SatellitePanel = lazy(() => import("./components/SatellitePanel"));
const TiltChart = lazy(() => import("./components/TiltChart"));

const loadSatellite = (signal: AbortSignal) => api.satelliteMap(undefined, signal);

export default function App() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showResolved, setShowResolved] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "WARNING" | "CRITICAL">("ALL");
  // admin-ключ тримаємо лише в пам'яті сторінки: ні в localStorage, ні в збірці
  const [adminKey, setAdminKey] = useState("");

  const objectSource = usePolling(api.objects);
  const objects = objectSource.data ?? [];
  const statuses = useObjectStatuses(objects, refreshKey);
  const satellite = usePolling(loadSatellite);
  const thresholds = usePolling(api.thresholds);
  const loadAlerts = useCallback((signal: AbortSignal) => api.alerts({
    resolved: showResolved ? undefined : false,
    objectId: selectedId ?? undefined,
    limit: 500,
  }, signal), [selectedId, showResolved]);
  const alerts = usePolling(loadAlerts, refreshKey);

  const resolve = async (id: number) => {
    setResolveError(null);
    try {
      await api.resolveAlert(id, adminKey);
      setRefreshKey((key) => key + 1);
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : String(e));
    }
  };

  const selected = objects.find((o) => o.id === selectedId);
  // повторний клік по вибраному об'єкту знімає вибір
  const toggleSelect = (id: number) => setSelectedId((cur) => (cur === id ? null : id));

  return (
    <div className="app">
      <header>
        <div className="identity">
          <h1 className="brand">KORA</h1>
          <span className="muted hide-sm">{t("app.subtitle")}</span>
        </div>
        <div className="spacer" />
        <LangSwitch />
        <input
          className="key"
          type="password"
          aria-label={t("app.adminKey")}
          placeholder={t("app.adminKey")}
          value={adminKey}
          autoComplete="off"
          onChange={(e) => setAdminKey(e.target.value)}
        />
      </header>
      <main>
        <div className="mapwrap">
          <div className="map-heading">
            <h2>{t("app.mapTitle")}</h2>
            <SourceRefresh source={objectSource} label="app.objects" />
          </div>
          <MapView
            objects={objects}
            statuses={statuses}
            satellite={satellite}
            selectedId={selectedId}
            onSelect={toggleSelect}
            thresholds={thresholds.data}
          />
          <ul className="objlist">
            {objects.map((o) => (
              <li key={o.id}>
                <button className={o.id === selectedId ? "sel" : ""} aria-pressed={o.id === selectedId}
                  onClick={() => toggleSelect(o.id)}>
                  {o.name} <StatusBadge status={displayStatus(statuses[o.id])} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          {objectSource.data?.length === 0 && <p className="muted">{t("app.noObjects")}</p>}
          {!selected && objects.length > 0 && (
            <p className="muted">{t("app.pickObject")}</p>
          )}
          {selected && (
            <Fragment key={selected.id}>
              <ObjectPanel obj={selected} status={statuses[selected.id] ?? EMPTY_SOURCE} refreshKey={refreshKey} />
              <Suspense fallback={<section className="card skeleton" aria-busy="true" />}>
                <SatellitePanel objectId={selected.id} status={statuses[selected.id]?.data ?? null}
                  thresholds={thresholds} alerts={alerts.data ?? []} />
                <TiltChart objectId={selected.id} thresholds={thresholds.data} />
              </Suspense>
            </Fragment>
          )}
          <AlertsList
            source={alerts}
            objects={objects}
            selectedId={selectedId}
            onClear={() => setSelectedId(null)}
            onSelect={setSelectedId}
            canResolve={adminKey.length > 0}
            onResolve={resolve}
            resolveError={resolveError}
            filter={filter}
            setFilter={setFilter}
            showResolved={showResolved}
            setShowResolved={setShowResolved}
          />
        </aside>
      </main>
    </div>
  );
}
