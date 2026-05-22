import { Clock3, SearchCheck } from "lucide-react";
import Button from "@/components/ui/Button";

const ACTION_LABELS = {
  RANK_APPLICANTS: "Xếp hạng ứng viên",
  FIND_TALENT: "Tìm kiếm ứng viên",
};

const formatSessionTime = (value) => {
  if (!value) return "Chưa rõ thời gian";

  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default function MatchingHistoryList({
  sessions,
  selectedId,
  onSelect,
}) {
  return (
    <section
      className="h-full min-h-[420px] space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Lịch sử phiên tìm kiếm"
    >
      {sessions.map((session) => {
        const isSelected = session.id === selectedId;

        return (
          <article
            key={session.id}
            className={`rounded-2xl border p-4 transition ${
              isSelected
                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
            }`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                    <SearchCheck className="h-3.5 w-3.5" />
                    {ACTION_LABELS[session.actionType] || session.actionType}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatSessionTime(session.searchedAt)}
                  </span>
                </div>

                <h2 className="mt-3 truncate text-lg font-bold text-slate-900">
                  {session.job?.title || "Tin tuyển dụng"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {session.job?.companyName || "Chưa rõ công ty"}
                </p>
              </div>

              <Button
                size="sm"
                variant={isSelected ? "secondary" : "outline"}
                onClick={() => onSelect(session.id)}
              >
                Xem phiên
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
