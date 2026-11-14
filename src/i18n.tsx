import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "uk";

const dict = {
  en: {
    "app.title": "KORA — building health monitoring",
    "app.subtitle": "NISAR satellite + IoT monitoring",
    "app.satellitePoints": "satellite points",
    "app.adminKey": "admin key (to resolve alerts)",
    "app.apiError": "Cannot reach the API: {error}",
    "app.noObjects": "No monitored objects yet.",
    "app.pickObject": "Select an object on the map or in the list to see details. Alerts for all objects are shown below.",
    "app.objects": "Objects",
    "status.UNKNOWN": "Unknown",
    "status.NORMAL": "Normal",
    "status.WARNING": "Warning",
    "status.CRITICAL": "Critical",
    "panel.tiltX": "Tilt X",
    "panel.tiltY": "Tilt Y",
    "panel.temperature": "Temperature",
    "panel.humidity": "Humidity",
    "panel.displacement": "Satellite displacement",
    "panel.activeAlerts": "Active alerts",
    "panel.updated": "Updated",
    "panel.notEnough": "Not enough data to assess the state.",
    "panel.disclaimer": "Alerts are indicators for inspection, not a conclusion about structural failure.",
    "chart.title": "Structure tilt",
    "chart.1h": "1 h",
    "chart.24h": "24 h",
    "chart.7d": "7 days",
    "chart.all": "All",
    "chart.noSensors": "No sensors are attached to this object.",
    "chart.noData": "No measurements in this period.",
    "alerts.title": "Alerts",
    "alerts.titleFor": "Alerts: {name}",
    "alerts.titleAll": "Alerts (all objects)",
    "alerts.all": "All",
    "alerts.warning": "Warning",
    "alerts.critical": "Critical",
    "alerts.resolvedFilter": "resolved",
    "alerts.showAll": "Show for all objects",
    "alerts.none": "No alerts.",
    "alerts.sensor": "Sensor #{id}",
    "alerts.satellite": "Satellite",
    "alerts.resolved": "resolved",
    "alerts.resolve": "Resolve",
    "alerts.needKey": "Enter the admin key",
    "alerts.object": "Object {id}",
    "map.satellite": "Satellite ({source})",
    "map.displacement": "Displacement",
    "map.date": "Date",
  },
  uk: {
    "app.title": "KORA — моніторинг стану будівель",
    "app.subtitle": "Супутник NISAR + IoT-моніторинг",
    "app.satellitePoints": "супутникові точки",
    "app.adminKey": "admin-ключ (для «Вирішено»)",
    "app.apiError": "Помилка з'єднання з API: {error}",
    "app.noObjects": "Об'єктів моніторингу ще немає.",
    "app.pickObject": "Оберіть об'єкт на карті або в списку, щоб побачити деталі. Нижче показані попередження по всіх об'єктах.",
    "app.objects": "Об'єкти",
    "status.UNKNOWN": "Невідомо",
    "status.NORMAL": "Норма",
    "status.WARNING": "Увага",
    "status.CRITICAL": "Критично",
    "panel.tiltX": "Нахил X",
    "panel.tiltY": "Нахил Y",
    "panel.temperature": "Температура",
    "panel.humidity": "Вологість",
    "panel.displacement": "Зміщення (супутник)",
    "panel.activeAlerts": "Активні попередження",
    "panel.updated": "Оновлено",
    "panel.notEnough": "Недостатньо даних для оцінки стану.",
    "panel.disclaimer": "Попередження — індикатори для перевірки, а не висновок про аварійність.",
    "chart.title": "Нахил конструкції",
    "chart.1h": "1 год",
    "chart.24h": "24 год",
    "chart.7d": "7 днів",
    "chart.all": "Усе",
    "chart.noSensors": "До об'єкта не прив'язано датчиків.",
    "chart.noData": "Немає вимірювань за цей період.",
    "alerts.title": "Попередження",
    "alerts.titleFor": "Попередження: {name}",
    "alerts.titleAll": "Попередження (усі об'єкти)",
    "alerts.all": "Усі",
    "alerts.warning": "Увага",
    "alerts.critical": "Критичні",
    "alerts.resolvedFilter": "вирішені",
    "alerts.showAll": "Показати для всіх об'єктів",
    "alerts.none": "Немає попереджень.",
    "alerts.sensor": "Датчик #{id}",
    "alerts.satellite": "Супутник",
    "alerts.resolved": "вирішено",
    "alerts.resolve": "Вирішено",
    "alerts.needKey": "Введіть admin-ключ",
    "alerts.object": "Об'єкт {id}",
    "map.satellite": "Супутник ({source})",
    "map.displacement": "Зміщення",
    "map.date": "Дата",
  },
} as const;

export type Key = keyof (typeof dict)["en"];

const LOCALE: Record<Lang, string> = { en: "en-GB", uk: "uk-UA" };
const STORAGE_KEY = "kora.lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "uk") return saved;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, params?: Record<string, string | number>) => string;
  fmtDateTime: (iso: string | null | undefined) => string;
  fmtDate: (iso: string) => string;
  fmtTime: (iso: string) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dict[lang]["app.title"];
  }, [lang]);

  const value = useMemo<Ctx>(() => {
    const locale = LOCALE[lang];
    return {
      lang,
      setLang,
      t: (key, params) => {
        let s: string = dict[lang][key];
        if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
        return s;
      },
      fmtDateTime: (iso) => (iso ? new Date(iso).toLocaleString(locale) : "—"),
      fmtDate: (iso) => new Date(iso).toLocaleDateString(locale),
      fmtTime: (iso) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
