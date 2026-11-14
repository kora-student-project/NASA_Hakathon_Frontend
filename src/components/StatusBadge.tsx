import { STATUS_COLOR, STATUS_LABEL } from "../format";
import type { Status } from "../types";

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="badge" style={{ background: STATUS_COLOR[status] }}>
      {STATUS_LABEL[status]}
    </span>
  );
}
