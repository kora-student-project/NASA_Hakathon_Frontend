import { useCallback, useEffect, useState } from "react";

export const POLL_MS = 15_000;
// Історія датчика важка (сотні рядків) і змінюється повільно: 138 КБ кожні 15 с на вкладку з'їли б безкоштовний трафік.
export const HISTORY_POLL_MS = 60_000;

export interface Source<T> {
  data: T | null;
  updatedAt: string | null;
  error: string | null;
}

export const EMPTY_SOURCE = { data: null, updatedAt: null, error: null };

export function sourceFailure<T>(previous: Source<T> | undefined, error: unknown): Source<T> {
  return {
    ...(previous ?? EMPTY_SOURCE),
    error: error instanceof Error ? error.message : String(error),
  };
}

export function usePoll(run: ((signal: AbortSignal) => Promise<void>) | null, refreshKey = 0, intervalMs = POLL_MS) {
  useEffect(() => {
    if (!run) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;

    const poll = async () => {
      if (running) return;
      running = true;
      // у прихованій вкладці не опитуємо сервер
      if (!document.hidden) await run(controller.signal);
      running = false;
      if (!controller.signal.aborted) timer = setTimeout(poll, intervalMs);
    };
    const onVisible = () => {
      if (!document.hidden && !running) {
        clearTimeout(timer);
        void poll();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    void poll();
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      controller.abort();
      clearTimeout(timer);
    };
  }, [run, refreshKey, intervalMs]);
}

type Loader<T> = (signal: AbortSignal) => Promise<T>;

export function usePolling<T>(load: Loader<T> | null, refreshKey = 0, intervalMs = POLL_MS): Source<T> {
  const [response, setResponse] = useState<{ load: Loader<T>; source: Source<T> }>();
  const run = useCallback(async (signal: AbortSignal) => {
    if (!load) return;
    try {
      const data = await load(signal);
      if (signal.aborted) return;
      setResponse({ load, source: { data, updatedAt: new Date().toISOString(), error: null } });
    } catch (error) {
      if (signal.aborted) return;
      setResponse((previous) => ({
        load,
        source: sourceFailure(previous?.load === load ? previous.source : undefined, error),
      }));
    }
  }, [load]);

  usePoll(load ? run : null, refreshKey, intervalMs);
  return response?.load === load ? response.source : EMPTY_SOURCE;
}
