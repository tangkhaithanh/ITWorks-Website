import {
  Briefcase,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import MatchScoreBar from "@/features/matching/components/MatchScoreBar";
import MatchStatusBadge from "@/features/matching/components/MatchStatusBadge";
import {
  formatExactPercent,
  getMatchApplicationId,
  getScoreTone,
  normalizeStatus,
  parseExplanationLines,
} from "@/features/matching/utils/matchingWorkspace.utils";

export default function MatchDetailDrawer({
  open,
  onClose,
  match,
  detail,
  loading,
  onOpenCv,
  onOpenApplication,
  onReject,
}) {
  if (!open || !match) return null;

  const explanationLines = parseExplanationLines(match.explanation);
  const candidate = detail?.candidate;
  const matchedCandidateUser = match.candidate?.user;
  const candidateName =
    candidate?.full_name || matchedCandidateUser?.full_name || match.displayName;
  const cvPath = match.file_url || match.cvPath;
  const applicationId = getMatchApplicationId(match);

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Chi tiết ứng viên
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {candidateName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <img
                src={
                  candidate?.avatar_url ||
                  matchedCandidateUser?.avatar_url ||
                  match.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=random`
                }
                alt={candidateName}
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700">{match.subtitle}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.locationLabel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {match.experienceLabel}
                  </span>
                  {candidate?.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {candidate.phone}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate?.email ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {candidate.email}
                    </span>
                  ) : null}
                  {applicationId ? <MatchStatusBadge status={match.applicationStatus} /> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Phân tích mức độ phù hợp
              </h3>
              <span
                className={`rounded-full border px-3 py-1 text-sm font-bold ${getScoreTone(match.overall_score).chip}`}
              >
                {formatExactPercent(match.overall_score)}
              </span>
            </div>
            <div className="space-y-4">
              <MatchScoreBar label="Điểm tổng thể" value={match.overall_score} />
              <MatchScoreBar label="Độ tương đồng ngữ nghĩa" value={match.scores?.semantic_score} />
              <MatchScoreBar label="Điểm kỹ năng" value={match.scores?.skill_match_score} />
              <MatchScoreBar label="Kinh nghiệm" value={match.scores?.experience_score} />
              <MatchScoreBar label="Điểm địa điểm" value={match.scores?.location_score} />
              <MatchScoreBar label="Điểm lương" value={match.scores?.salary_score} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Giải thích
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              {explanationLines.length > 0 ? (
                explanationLines.map((line) => (
                  <div key={line} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {line}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">Chưa có diễn giải thêm.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Tài liệu & Hành động
            </h3>

            {loading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Đang tải thông tin hồ sơ...
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="secondary" onClick={() => onOpenCv({ ...match, cvPath })} disabled={!cvPath}>
                  <FileText className="h-4 w-4" />
                  Xem CV
                </Button>

                {applicationId ? (
                  <Button size="sm" variant="outline" onClick={() => onOpenApplication(match)}>
                    <ExternalLink className="h-4 w-4" />
                    Xem đơn ứng tuyển
                  </Button>
                ) : null}

                {applicationId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    onClick={() => onReject(match)}
                    disabled={normalizeStatus(match.applicationStatus) === "rejected"}
                  >
                    <XCircle className="h-4 w-4" />
                    Từ chối
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                    Ứng viên trong kho hiện chưa có mã đơn ứng tuyển.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
