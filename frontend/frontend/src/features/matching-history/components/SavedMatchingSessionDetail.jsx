import { Braces, Clock3, Loader2, SearchCheck, UserRoundSearch } from "lucide-react";

const ACTION_LABELS = {
  RANK_APPLICANTS: "Rank Applicants",
  FIND_TALENT: "Find Talent",
};

const getMatches = (session) =>
  Array.isArray(session?.response?.matches) ? session.response.matches : [];

const getCandidateLabel = (match, index) =>
  match?.candidate_name ||
  match?.name ||
  match?.full_name ||
  match?.displayName ||
  `Ung vien ${index + 1}`;

const getScoreLabel = (match) => {
  const score = Number(match?.overall_score ?? match?.score);

  if (!Number.isFinite(score)) return null;
  return `${(score * 100).toFixed(1)}%`;
};

const formatSessionTime = (value) => {
  if (!value) return "Chua ro thoi gian";

  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function SessionPlaceholder({ loading, error }) {
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-blue-600">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <UserRoundSearch className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        {error ? "Khong tai duoc phien matching" : "Chon mot phien matching"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {error ||
          "Ket qua da luu cua phien matching se hien tai day, khong chay lai matching."}
      </p>
    </div>
  );
}

export default function SavedMatchingSessionDetail({ session, loading, error }) {
  if (!session) {
    return <SessionPlaceholder loading={loading} error={error} />;
  }

  const matches = getMatches(session);

  return (
    <section className="space-y-5" aria-live="polite">
      <header className="border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            <SearchCheck className="h-3.5 w-3.5" />
            {ACTION_LABELS[session.actionType] || session.actionType}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            {formatSessionTime(session.searchedAt)}
          </span>
        </div>

        <h2 className="mt-3 text-xl font-bold text-slate-900">
          {session.job?.title || "Job matching"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {session.job?.companyName || "Chua ro cong ty"}
        </p>
      </header>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-600">
            Ket qua da luu
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {Number(session.response?.total ?? matches.length)} ket qua
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Phien matching nay khong co ung vien phu hop trong response da luu.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {matches.slice(0, 8).map((match, index) => (
              <div
                key={
                  match?.source_cv_id ||
                  match?.source_candidate_id ||
                  match?.candidate_id ||
                  index
                }
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {getCandidateLabel(match, index)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Candidate #{match?.source_candidate_id || match?.candidate_id || "?"}
                  </p>
                </div>
                {getScoreLabel(match) ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {getScoreLabel(match)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="rounded-2xl border border-slate-200 bg-slate-950 text-slate-50">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
          <Braces className="h-4 w-4" />
          Response da luu day du
        </summary>
        <pre className="max-h-[420px] overflow-auto border-t border-slate-800 p-4 text-xs leading-6 text-slate-200">
          {JSON.stringify(session.response, null, 2)}
        </pre>
      </details>
    </section>
  );
}
