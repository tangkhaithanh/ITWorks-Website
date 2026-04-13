import { formatPercent, getScoreTone } from "@/features/matching/utils/matchingWorkspace.utils";

export default function MatchScoreBar({ label, value }) {
  const tone = getScoreTone(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className={`font-semibold ${tone.text}`}>{formatPercent(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${Math.max(4, Number(value || 0) * 100)}%` }}
        />
      </div>
    </div>
  );
}
