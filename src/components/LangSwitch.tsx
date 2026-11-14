import { useI18n, type Lang } from "../i18n";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "uk", label: "UA" },
];

export default function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="seg" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          className={o.value === lang ? "on" : ""}
          aria-pressed={o.value === lang}
          onClick={() => setLang(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
