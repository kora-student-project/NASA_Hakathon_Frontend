import { useI18n } from "../i18n";
import type { Status } from "../types";

export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <i className="dot" />
      {t(`status.${status}`)}
    </span>
  );
}
