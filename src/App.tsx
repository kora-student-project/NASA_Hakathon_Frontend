import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import AlertsList from "./components/AlertsList";
import MapView from "./components/MapView";
import ObjectPanel from "./components/ObjectPanel";
import StatusBadge from "./components/StatusBadge";
import TiltChart from "./components/TiltChart";
import type { Alert, MonitoredObject, ObjectStatus, SatelliteCollection } from "./types";

const POLL_MS = 15_000;

export default function App() {
  const [objects, setObjects] = useState<MonitoredObject[]>([]);
  const [statuses, setStatuses] = useState<Record<number, ObjectStatus>>({});
  const [satellite, setSatellite] = useState<SatelliteCollection | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "WARNING" | "CRITICAL">("ALL");
  // admin-ключ тримаємо лише в пам'яті сторінки: ні в localStorage, ні в збірці
  const [adminKey, setAdminKey] = useState("");

  const load = useCallback(async () => {
    try {
      const objs = await api.objects();
      const [sts, sat, al] = await Promise.all([
        Promise.all(objs.map((o) => api.status(o.id))),
        api.satelliteMap(),
        api.alerts(showResolved ? null : false),
      ]);
      setObjects(objs);
      setStatuses(Object.fromEntries(sts.map((s) => [s.object_id, s])));
      setSatellite(sat);
      setAlerts(al);
      setSelectedId((cur) => cur ?? objs[0]?.id ?? null);
      setError(null);
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [showResolved]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const resolve = async (id: number) => {
    try {
      await api.resolveAlert(id, adminKey);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const selected = objects.find((o) => o.id === selectedId);

  return (
    <div className="app">
      <header>
        <h1>KORA</h1>
        <span className="muted hide-sm">NISAR + IoT моніторинг</span>
        <div className="spacer" />
        <label className="check">
          <input type="checkbox" checked={showSatellite} onChange={(e) => setShowSatellite(e.target.checked)} />
          супутникові точки
        </label>
        <input
          className="key"
          type="password"
          placeholder="admin-ключ (для «Вирішено»)"
          value={adminKey}
          autoComplete="off"
          onChange={(e) => setAdminKey(e.target.value)}
        />
      </header>
      {error && <div className="banner">Помилка з'єднання з API: {error}</div>}
      <main>
        <div className="mapwrap">
          <MapView
            objects={objects}
            statuses={statuses}
            satellite={satellite}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showSatellite={showSatellite}
          />
          <ul className="objlist">
            {objects.map((o) => (
              <li key={o.id}>
                <button className={o.id === selectedId ? "sel" : ""} onClick={() => setSelectedId(o.id)}>
                  {o.name} <StatusBadge status={statuses[o.id]?.status ?? "UNKNOWN"} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          {objects.length === 0 && !error && <p className="muted">Об'єктів моніторингу ще немає.</p>}
          {selected && (
            <>
              <ObjectPanel obj={selected} status={statuses[selected.id]} />
              <TiltChart objectId={selected.id} refreshKey={tick} />
            </>
          )}
          <AlertsList
            alerts={alerts}
            objects={objects}
            onSelect={setSelectedId}
            canResolve={adminKey.length > 0}
            onResolve={resolve}
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
