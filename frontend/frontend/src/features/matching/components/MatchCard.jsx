import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Eye,
  FileText,
  Mail,
  MapPin,
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
} from "@/features/matching/utils/matchingWorkspace.utils";

export default function MatchCard({
  item,
  index,
  mode,
  onViewDetail,
  onReject,
  onManageApplication,
  onOpenCv,
  onSaveToTalentPool,
}) {
  const overallTone = getScoreTone(item.overall_score);
  const isApplicantMode = mode === "job_rank_applicants";
  const applicationId = getMatchApplicationId(item);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <img
            src={
              item.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName)}&background=random`
            }
            alt={item.displayName}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
          />

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                #{index + 1}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{item.displayName}</h3>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isApplicantMode
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-violet-200 bg-violet-50 text-violet-700"
                }`}
              >
                {isApplicantMode ? "Đã ứng tuyển" : "Kho ứng viên"}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-600">{item.subtitle}</p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.locationLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {item.experienceLabel}
              </span>
              {applicationId ? (
                <span>Đơn ứng tuyển #{applicationId}</span>
              ) : (
                <span>Chưa ứng tuyển tin này</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-2xl border px-4 py-2 text-sm font-bold ${overallTone.chip}`}>
            {formatExactPercent(item.overall_score)}
          </div>
          {isApplicantMode ? <MatchStatusBadge status={item.applicationStatus} /> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MatchScoreBar label="Tổng thể" value={item.overall_score} />
        <MatchScoreBar label="Ngữ nghĩa" value={item.scores?.semantic_score} />
        <MatchScoreBar label="Kỹ năng" value={item.scores?.skill_match_score} />
        <MatchScoreBar label="Kinh nghiệm" value={item.scores?.experience_score} />
        <MatchScoreBar label="Địa điểm" value={item.scores?.location_score} />
        <MatchScoreBar label="Mức lương" value={item.scores?.salary_score} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            Kỹ năng phù hợp
          </p>
          <div className="flex flex-wrap gap-2">
            {(item.matched_skills || []).length > 0 ? (
              item.matched_skills.map((skill) => (
                <span
                  key={`${item.id}-${skill}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-emerald-700/80">
                Chưa có kỹ năng trùng khớp rõ ràng
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-700">
            Kỹ năng còn thiếu
          </p>
          <div className="flex flex-wrap gap-2">
            {(item.missing_skills || []).length > 0 ? (
              item.missing_skills.map((skill) => (
                <span
                  key={`${item.id}-missing-${skill}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-rose-700/80">
                Không có kỹ năng thiếu đáng chú ý
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="sm" variant="outline" onClick={() => onViewDetail(item)}>
          <Eye className="h-4 w-4" />
          Xem chi tiết
        </Button>

        {isApplicantMode ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => onManageApplication(item)}>
              <FileText className="h-4 w-4" />
              Quản lý hồ sơ
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => onReject(item)}
              disabled={normalizeStatus(item.applicationStatus) === "rejected"}
            >
              <XCircle className="h-4 w-4" />
              Từ chối
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenCv(item)}
              disabled={!(item.file_url || item.cvPath)}
            >
              <FileText className="h-4 w-4" />
              Xem CV
            </Button>
            <Button size="sm" variant="outline" className="border-slate-200 text-slate-500" disabled>
              <Mail className="h-4 w-4" />
              Mời ứng tuyển
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={
                item.isSavedToTalentPool
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
              }
              onClick={() => onSaveToTalentPool?.(item)}
              disabled={item.isSavedToTalentPool}
            >
              {item.isSavedToTalentPool ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {item.isSavedToTalentPool ? "Đã lưu" : "Lưu vào kho"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
