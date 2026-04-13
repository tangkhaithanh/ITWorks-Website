import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  DollarSign,
  Download,
  FileText,
  FilterX,
  MapPin,
  PanelLeftOpen,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";
import MatchCard from "@/features/matching/components/MatchCard";
import {
  JOB_STATUS_META,
  MATCHING_MODES,
  RESULT_SORT_OPTIONS,
} from "@/features/matching/constants/matchingWorkspace.constants";
import {
  exportMatchesToCsv,
  formatDate,
  formatSalary,
  getMatchApplicationId,
} from "@/features/matching/utils/matchingWorkspace.utils";

function JobDescriptionDrawer({ open, onClose, job }) {
  const description = job?.details?.description ?? job?.description ?? "";
  const requirements = job?.details?.requirements ?? job?.requirements ?? "";

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <div
      className={`fixed inset-0 z-[110] transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        className={`absolute left-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Job Detail
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-900">{job?.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-6 py-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Job Description
                </h3>
              </div>
            </div>

            {description ? (
              <div
                className="prose prose-slate max-w-none text-sm leading-7 text-slate-700 [&_ol]:pl-6 [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
              />
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Job nay chua co mo ta cong viec.
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-2xl bg-violet-50 p-2 text-violet-600">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Job Requirements
                </h3>
              </div>
            </div>

            {requirements ? (
              <div
                className="prose prose-slate max-w-none text-sm leading-7 text-slate-700 [&_ol]:pl-6 [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(requirements) }}
              />
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Job nay chua co phan yeu cau tuyen dung.
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
// Bộ lọc
function MatchingFiltersPanel({
  activeMode,
  availableSkills,
  draftFilters,
  onDraftFiltersChange,
  onApplyFilters,
  onResetFilters,
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Bộ lọc</h2>
      </div>

      <div className="mt-5 space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
            <span className="font-semibold">Overall score tối thiểu</span>
            <span>{draftFilters.minScore}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={draftFilters.minScore}
            onChange={(event) =>
              onDraftFiltersChange((prev) => ({
                ...prev,
                minScore: Number(event.target.value),
              }))
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Kỹ năng matched</p>
          <div className="flex flex-wrap gap-2">
            {availableSkills.length > 0 ? (
              availableSkills.map((skill) => {
                const isSelected = draftFilters.matchedSkills.includes(skill);

                return (
                  <button
                    key={`filter-${skill}`}
                    onClick={() =>
                      onDraftFiltersChange((prev) => ({
                        ...prev,
                        matchedSkills: isSelected
                          ? prev.matchedSkills.filter((item) => item !== skill)
                          : [...prev.matchedSkills, skill],
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">Job này chưa có danh sách kỹ năng rõ ràng.</p>
            )}
          </div>
        </div>

        {activeMode === "job_rank_applicants" ? (
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Trạng thái application</p>
            <SelectInput
              name="filterStatus"
              value={draftFilters.status}
              onChange={(event) =>
                onDraftFiltersChange((prev) => ({ ...prev, status: event.target.value }))
              }
              options={[
                { value: "all", label: "Tất cả" },
                { value: "pending", label: "Pending" },
                { value: "interviewing", label: "Interviewing" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            Chế độ FindTalent là chế độ matching toàn hệ thống nên có thể tiêu tốn credits cao hơn, và tốn nhiều thời gian hơn
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={onApplyFilters}>
            <CheckCircle2 className="h-4 w-4" />
            Áp dụng
          </Button>
          <Button size="sm" variant="outline" onClick={onResetFilters}>
            <FilterX className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MatchingResultsPanel({
  selectedJob,
  activeMode,
  hasLoadedCurrentMode,
  matchingLoading,
  matchingRefreshing,
  filteredMatches,
  resultSort,
  onResultSortChange,
  onRefreshMatch,
  onViewDetail,
  onReject,
  onManageApplication,
  onOpenCv,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              Tìm thấy {hasLoadedCurrentMode ? filteredMatches.length : 0} ứng viên phù hợp
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SelectInput
              name="resultSort"
              value={resultSort}
              onChange={(event) => onResultSortChange(event.target.value)}
              options={RESULT_SORT_OPTIONS}
              disabled={!hasLoadedCurrentMode || matchingLoading}
            />

            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshMatch}
              disabled={!hasLoadedCurrentMode || matchingRefreshing || matchingLoading}
            >
              <RefreshCw className={`h-4 w-4 ${matchingRefreshing ? "animate-spin" : ""}`} />
              Re-run
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                exportMatchesToCsv({
                  job: selectedJob,
                  mode: activeMode,
                  matches: filteredMatches,
                })
              }
              disabled={!hasLoadedCurrentMode || filteredMatches.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {matchingLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">Đang chạy matching</p>
          <p className="mt-2 text-sm text-slate-500">
            Hệ thống đang phân tích theo mode bạn đã chọn.
          </p>
        </div>
      ) : !hasLoadedCurrentMode ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Chọn mode rồi bắt đầu matching</h3>
          <p className="mt-2 text-sm text-slate-500">
            Workspace sẽ hiển thị kết quả ngay sau khi bạn chạy mode{" "}
            <span className="font-semibold text-slate-700">{MATCHING_MODES[activeMode].title}</span>.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Không có ứng viên phù hợp với bộ lọc hiện tại
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Thử giảm ngưỡng điểm hoặc bỏ bớt kỹ năng đang lọc.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((item, index) => (
            <MatchCard
              key={`${activeMode}-${item.id}-${getMatchApplicationId(item) || item.source_candidate_id}`}
              item={item}
              index={index}
              mode={activeMode}
              onViewDetail={onViewDetail}
              onReject={onReject}
              onManageApplication={onManageApplication}
              onOpenCv={onOpenCv}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// Trang workspace dành cho matching 
export default function MatchingWorkspaceView({
  selectedJob,
  availableSkills,
  activeMode,
  onActiveModeChange,
  loadedModes,
  rankTotal,
  talentTotal,
  matchingLoading,
  matchingRefreshing,
  hasLoadedCurrentMode,
  onStartMatch,
  draftFilters,
  onDraftFiltersChange,
  onApplyFilters,
  onResetFilters,
  filteredMatches,
  resultSort,
  onResultSortChange,
  onRefreshMatch,
  onViewDetail,
  onReject,
  onManageApplication,
  onOpenCv,
  onBackToJobs,
}) {
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);

  useEffect(() => {
    setJobDrawerOpen(false);
  }, [selectedJob?.id]);

  return (
    <div className="space-y-6">
      <JobDescriptionDrawer
        open={jobDrawerOpen}
        onClose={() => setJobDrawerOpen(false)}
        job={selectedJob}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <button
          onClick={onBackToJobs}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Đổi Job
        </button>

        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{selectedJob.title}</h1>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  JOB_STATUS_META[selectedJob.status]?.className || JOB_STATUS_META.active.className
                }`}
              >
                {JOB_STATUS_META[selectedJob.status]?.label || selectedJob.status}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setJobDrawerOpen(true)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <PanelLeftOpen className="h-4 w-4" />
                Xem JD
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>Job #{selectedJob.id}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedJob.location?.full || selectedJob.location_full || "Chưa cập nhật địa điểm"}
              </span>
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatSalary(selectedJob)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {loadedModes.job_rank_applicants ? rankTotal : selectedJob?._count?.applications || 0}{" "}
                ứng viên đã apply
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Đăng ngày {formatDate(selectedJob.created_at)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {availableSkills.map((skill) => (
                <span
                  key={`job-skill-${skill}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={() => onActiveModeChange("job_rank_applicants")}
                disabled={matchingLoading || matchingRefreshing}
                className={`rounded-[1.75rem] border px-5 py-4 text-left transition-all ${
                  activeMode === "job_rank_applicants"
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${matchingLoading || matchingRefreshing ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <p className="text-sm font-bold text-slate-900">
                  Rank Applicants
                  {loadedModes.job_rank_applicants ? ` (${rankTotal})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {MATCHING_MODES.job_rank_applicants.description}
                </p>
              </button>

              <button
                onClick={() => onActiveModeChange("job_find_talent")}
                disabled={matchingLoading || matchingRefreshing}
                className={`rounded-[1.75rem] border px-5 py-4 text-left transition-all ${
                  activeMode === "job_find_talent"
                    ? "border-violet-200 bg-violet-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${matchingLoading || matchingRefreshing ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <p className="text-sm font-bold text-slate-900">
                  Find Talent
                  {loadedModes.job_find_talent ? ` (${talentTotal})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {MATCHING_MODES.job_find_talent.description}
                </p>
              </button>
            </div>

            <Button onClick={onStartMatch} disabled={matchingLoading || matchingRefreshing} className="w-full">
              <RefreshCw className={`h-4 w-4 ${matchingLoading || matchingRefreshing ? "animate-spin" : ""}`} />
              {matchingLoading || matchingRefreshing
                ? "Đang matching..."
                : hasLoadedCurrentMode
                  ? "Chạy lại matching"
                  : "Bắt đầu matching"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px,minmax(0,1fr)]">
        <MatchingFiltersPanel
          activeMode={activeMode}
          availableSkills={availableSkills}
          draftFilters={draftFilters}
          onDraftFiltersChange={onDraftFiltersChange}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
        />

        <MatchingResultsPanel
          selectedJob={selectedJob}
          activeMode={activeMode}
          hasLoadedCurrentMode={hasLoadedCurrentMode}
          matchingLoading={matchingLoading}
          matchingRefreshing={matchingRefreshing}
          filteredMatches={filteredMatches}
          resultSort={resultSort}
          onResultSortChange={onResultSortChange}
          onRefreshMatch={onRefreshMatch}
          onViewDetail={onViewDetail}
          onReject={onReject}
          onManageApplication={onManageApplication}
          onOpenCv={onOpenCv}
        />
      </div>
    </div>
  );
}
