import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "uk";

const dict = {
  en: {
    "app.mapTitle": "Monitoring map",
    "data.loading": "Loading…",
    "data.fresh": "Fetched {time}",
    "data.stale": "Stale · last fetched {time}",
    "data.offline": "Unavailable",
    "data.building": "Building status",
    "data.sensors": "Sensor list",
    "data.satelliteHistory": "Displacement history",
    "data.thresholds": "Thresholds",
    "map.basemap": "Base map",
    "map.streets": "Streets",
    "map.imagery": "Satellite imagery",
    "map.observations": "Displacement points",
    "map.landslides": "Landslide reports",
    "map.susceptibility": "Landslide susceptibility",
    "map.nisar": "NISAR radar map",
    "map.nisarDate": "NISAR date",
    "map.nisarPrev": "Previous day",
    "map.nisarNext": "Next day",
    "map.nisarLatest": "Latest pass here",
    "map.nisarSearching": "Searching…",
    "map.nisarNone": "No NISAR imagery found here in the last 30 days.",
    "map.nisarNote": "Radar brightness (backscatter), not displacement. Each place is imaged about every 12 days, so most days are empty.",
    "map.nisarLegend": "NASA GIBS · NISAR L2 GCOV (false colour)",
    "map.susceptibilityScale": "Susceptibility classes from 0 to 5",
    "map.susceptibilityLow": "Lower",
    "map.susceptibilityHigh": "Higher",
    "map.susceptibilitySource": "NASA regional model · 30″ grid",
    "map.susceptibilityLoading": "Loading NASA susceptibility map…",
    "map.susceptibilityError": "NASA susceptibility map could not be loaded.",
    "map.susceptibilityCoverage": "This view is outside the NASA susceptibility map coverage.",
    "map.thresholdLegend": "Marker color shows threshold level",
    "map.landslideLegend": "Reported landslides · NASA COOLR",
    "map.landslideLoading": "Loading NASA COOLR reports…",
    "map.landslideZoom": "Zoom in to see landslide reports.",
    "map.landslideEmpty": "No landslides reported in this view.",
    "map.landslideLimit": "Zoom in to see more reports for a smaller area.",
    "map.landslideError": "NASA COOLR reports could not be loaded.",
    "sat.title": "Satellite displacement",
    "sat.latest": "Latest reading from the API",
    "sat.noLatest": "No current satellite reading for this building.",
    "sat.noThresholds": "Displacement thresholds are unavailable.",
    "sat.unknownUnit": "The reading uses an unsupported unit.",
    "sat.history": "Available observations",
    "sat.noHistory": "No chartable observations for this building.",
    "sat.activeAlerts": "Active satellite alerts",
    "sat.explanation": "The badge compares absolute displacement with the thresholds. Exceedance can trigger a satellite alert. The API sets the building status from the most severe active alert across satellite and sensor readings.",
    "panel.accel": "Accelerometer",
    "panel.gyro": "Gyroscope",
    "panel.tilt": "Tilt",
    "chart.sensor": "Sensor",
    "chart.range": "Time range",
    "chart.noSeries": "This measurement group has no readings in the selected period.",
    "chart.gyroUnit": "Raw values from the device. The API omits the unit.",
    "chart.latest": "Latest reading in range",
    "app.title": "KORA — building health monitoring",
    "app.subtitle": "NISAR satellite + IoT monitoring",
    "app.adminKey": "admin key (to resolve alerts)",
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
    "panel.activeAlerts": "Active alerts",
    "panel.updated": "Latest measurement",
    "panel.reason": "What triggered this status",
    "panel.reasonSatellite": "Satellite displacement {value} mm · threshold {limit} mm",
    "panel.reasonTilt": "Tilt {axis} at {value}° · threshold {limit}°",
    "panel.reasonObservation": "Observation on {date}",
    "panel.reasonAlertDate": "Alert raised {date}",
    "panel.reasonUnavailable": "The active alert details are unavailable.",
    "panel.notEnough": "Not enough data to assess the state.",
    "panel.disclaimer": "Alerts are indicators for inspection, not a conclusion about structural failure.",
    "chart.title": "Sensor history",
    "chart.1h": "1 h",
    "chart.24h": "24 h",
    "chart.7d": "7 days",
    "chart.all": "Up to 500 readings",
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
    "alerts.resolveError": "Could not resolve the alert ({error}).",
    "alerts.needKey": "Enter the admin key",
    "alerts.object": "Object {id}",
    "map.satellite": "Satellite ({source})",
    "map.displacement": "Displacement",
    "map.date": "Date",
  },
  uk: {
    "app.mapTitle": "Карта моніторингу",
    "data.loading": "Завантаження…",
    "data.fresh": "Отримано {time}",
    "data.stale": "Дані застаріли · отримано {time}",
    "data.offline": "Недоступно",
    "data.building": "Статус будівлі",
    "data.sensors": "Список датчиків",
    "data.satelliteHistory": "Історія зміщень",
    "data.thresholds": "Пороги",
    "map.basemap": "Підкладка карти",
    "map.streets": "Вулиці",
    "map.imagery": "Супутникові знімки",
    "map.observations": "Точки зміщення",
    "map.landslides": "Звіти про зсуви",
    "map.susceptibility": "Схильність до зсувів",
    "map.nisar": "Радарна карта NISAR",
    "map.nisarDate": "Дата NISAR",
    "map.nisarPrev": "Попередній день",
    "map.nisarNext": "Наступний день",
    "map.nisarLatest": "Останній проліт тут",
    "map.nisarSearching": "Пошук…",
    "map.nisarNone": "За останні 30 днів знімків NISAR тут не знайдено.",
    "map.nisarNote": "Радарна яскравість (розсіювання), а не зміщення. Кожну ділянку знімають приблизно раз на 12 діб, тому більшість днів порожні.",
    "map.nisarLegend": "NASA GIBS · NISAR L2 GCOV (хибні кольори)",
    "map.susceptibilityScale": "Класи схильності від 0 до 5",
    "map.susceptibilityLow": "Нижча",
    "map.susceptibilityHigh": "Вища",
    "map.susceptibilitySource": "Регіональна модель NASA · крок 30″",
    "map.susceptibilityLoading": "Завантаження карти схильності NASA…",
    "map.susceptibilityError": "Не вдалося завантажити карту схильності NASA.",
    "map.susceptibilityCoverage": "Ця область за межами покриття карти схильності NASA.",
    "map.thresholdLegend": "Колір точки відповідає рівню порога",
    "map.landslideLegend": "Зареєстровані зсуви · NASA COOLR",
    "map.landslideLoading": "Завантаження звітів NASA COOLR…",
    "map.landslideZoom": "Збільште масштаб, щоб побачити звіти про зсуви.",
    "map.landslideEmpty": "У цій області каталог не містить звітів про зсуви.",
    "map.landslideLimit": "Збільште масштаб, щоб побачити більше звітів для меншої ділянки.",
    "map.landslideError": "Не вдалося завантажити звіти NASA COOLR.",
    "sat.title": "Супутникове зміщення",
    "sat.latest": "Останнє вимірювання з API",
    "sat.noLatest": "Для цієї будівлі немає поточного супутникового вимірювання.",
    "sat.noThresholds": "Пороги зміщення недоступні.",
    "sat.unknownUnit": "Одиницю цього вимірювання не вдалося зіставити з порогами.",
    "sat.history": "Доступні спостереження",
    "sat.noHistory": "Для цієї будівлі немає спостережень, придатних для графіка.",
    "sat.activeAlerts": "Активні супутникові попередження",
    "sat.explanation": "Позначка порівнює модуль зміщення з порогами. Перевищення може створити супутникове попередження. API визначає статус будівлі за найвищим рівнем серед активних попереджень від датчиків і супутника.",
    "panel.accel": "Акселерометр",
    "panel.gyro": "Гіроскоп",
    "panel.tilt": "Нахил",
    "chart.sensor": "Датчик",
    "chart.range": "Період",
    "chart.noSeries": "У вибраному періоді немає вимірів цієї групи.",
    "chart.gyroUnit": "Сирі значення з пристрою. API не вказує одиницю вимірювання.",
    "chart.latest": "Останній вимір у періоді",
    "app.title": "KORA — моніторинг стану будівель",
    "app.subtitle": "Супутник NISAR + IoT-моніторинг",
    "app.adminKey": "admin-ключ (для «Вирішено»)",
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
    "panel.activeAlerts": "Активні попередження",
    "panel.updated": "Останній вимір",
    "panel.reason": "Що визначає статус",
    "panel.reasonSatellite": "Супутникове зміщення {value} мм · поріг {limit} мм",
    "panel.reasonTilt": "Нахил {axis} {value}° · поріг {limit}°",
    "panel.reasonObservation": "Спостереження від {date}",
    "panel.reasonAlertDate": "Попередження від {date}",
    "panel.reasonUnavailable": "Деталі активного попередження недоступні.",
    "panel.notEnough": "Недостатньо даних для оцінки стану.",
    "panel.disclaimer": "Попередження — індикатори для перевірки, а не висновок про аварійність.",
    "chart.title": "Історія датчика",
    "chart.1h": "1 год",
    "chart.24h": "24 год",
    "chart.7d": "7 днів",
    "chart.all": "До 500 вимірів",
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
    "alerts.resolveError": "Не вдалося закрити попередження ({error}).",
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
      fmtDate: (iso) => new Date(iso).toLocaleDateString(locale, /^\d{4}-\d{2}-\d{2}$/.test(iso) ? { timeZone: "UTC" } : undefined),
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
