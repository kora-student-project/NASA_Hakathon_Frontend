import { useCallback, useState } from "react";
import { api } from "./api";
import { POLL_MS, sourceFailure, usePoll, type Source } from "./polling";
import type { MonitoredObject, ObjectStatus, Status } from "./types";

// Leave browser connections available for alerts and time series while fetching markers.
const STATUS_CONCURRENCY = 4;

export function useObjectStatuses(objects: MonitoredObject[], refreshKey: number) {
  const [statuses, setStatuses] = useState<Record<number, Source<ObjectStatus>>>({});
  const objectIds = objects.map(({ id }) => id).join(",");
  const load = useCallback(async (signal: AbortSignal) => {
    const ids = objectIds.split(",").map(Number);
    const queue = ids.values();

    // Only retain cached results for objects still present in the list.
    setStatuses((previous) => Object.fromEntries(ids.flatMap((id) => previous[id] ? [[id, previous[id]]] : [])));

    async function worker() {
      for (const id of queue) {
        if (signal.aborted) return;
        try {
          const data = await api.status(id, signal);
          if (signal.aborted) return;
          const updatedAt = new Date().toISOString();
          setStatuses((previous) => ({ ...previous, [id]: { data, updatedAt, error: null } }));
        } catch (error) {
          if (signal.aborted) return;
          setStatuses((previous) => ({ ...previous, [id]: sourceFailure(previous[id], error) }));
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(ids.length, STATUS_CONCURRENCY) }, worker));
  }, [objectIds]);

  usePoll(objectIds ? load : null, refreshKey);
  return statuses;
}

/** Дані застаріли: останній запит невдалий і успішна відповідь була давніше за ~2 цикли опитування. */
export function isStale(source: Source<ObjectStatus> | undefined): boolean {
  return Boolean(source?.error && source.updatedAt && Date.now() - Date.parse(source.updatedAt) > 2 * POLL_MS);
}

/** Статус для відображення: застарілі або відсутні дані = UNKNOWN, а не «зелений» старий статус. */
export function displayStatus(source: Source<ObjectStatus> | undefined): Status {
  if (!source?.data || isStale(source)) return "UNKNOWN";
  return source.data.status;
}
