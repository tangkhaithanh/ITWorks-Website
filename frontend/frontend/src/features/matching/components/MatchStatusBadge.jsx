import { APPLICATION_STATUS_META } from "@/features/matching/constants/matchingWorkspace.constants";
import { normalizeStatus } from "@/features/matching/utils/matchingWorkspace.utils";

export default function MatchStatusBadge({ status }) {
  const meta = APPLICATION_STATUS_META[normalizeStatus(status)] || APPLICATION_STATUS_META.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
