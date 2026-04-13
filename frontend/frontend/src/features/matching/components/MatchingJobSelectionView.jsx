import {
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";
import JobCardSkeleton from "@/features/matching/components/JobCardSkeleton";
import {
  JOB_STATUS_META,
  PAGE_SIZE,
} from "@/features/matching/constants/matchingWorkspace.constants";
import {
  formatDate,
  formatSalary,
  getJobSkills,
} from "@/features/matching/utils/matchingWorkspace.utils";
// Trang tìm kiếm công việc
export default function MatchingJobSelectionView({
  jobsTotal,
  jobSearch,
  onJobSearchChange,
  jobStatus,
  onJobStatusChange,
  jobSort,
  onJobSortChange,
  onSearch,
  jobsLoading,
  jobs,
  jobsPage,
  totalJobPages,
  onPageChange,
  onOpenWorkspace,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Matching Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Chọn tin tuyển dụng để bắt đầu phân tích ứng viên
            </h1>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-sm backdrop-blur">
            <p className="text-blue-100">Số tin hiển thị</p>
            <p className="mt-1 text-3xl font-bold text-white">{jobsTotal}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.6fr,220px,220px,auto]">
          <div className="relative" onKeyDown={(event) => event.key === "Enter" && onSearch()}>
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <TextInput
              name="jobSearch"
              value={jobSearch}
              onChange={(event) => onJobSearchChange(event.target.value)}
              placeholder="Nhập tên job, mã job, kỹ năng yêu cầu..."
              className="pl-11"
              width="full"
            />
          </div>

          <SelectInput
            name="jobStatus"
            value={jobStatus}
            onChange={(event) => onJobStatusChange(event.target.value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "active", label: "Đang mở" },
              { value: "hidden", label: "Đang ẩn" },
              { value: "closed", label: "Đã đóng" },
              { value: "expired", label: "Hết hạn" },
            ]}
            className="!w-full"
          />

          <SelectInput
            name="jobSort"
            value={jobSort}
            onChange={(event) => onJobSortChange(event.target.value)}
            options={[
              { value: "created_desc", label: "Mới nhất" },
              { value: "applications_desc", label: "Nhiều ứng viên" },
              { value: "title_asc", label: "A-Z" },
            ]}
            className="!w-full"
          />

          <Button onClick={onSearch}>
            <Search className="h-4 w-4" />
            Tìm
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {jobsLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, index) => <JobCardSkeleton key={index} />)
          : jobs.map((job) => {
              const statusMeta = JOB_STATUS_META[job.status] || JOB_STATUS_META.active;
              const skills = getJobSkills(job).slice(0, 4);

              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onOpenWorkspace(job)}
                  className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                          #{job.id}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-900">{job.title}</h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {job.location?.full || job.location_full || "Chưa cập nhật địa điểm"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      {formatSalary(job)}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      Đăng ngày {formatDate(job.created_at)}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      {(job?._count?.applications || 0).toLocaleString("vi-VN")} ứng viên đã apply
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span
                          key={`${job.id}-${skill}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Chưa có kỹ năng hiển thị</span>
                    )}
                  </div>
                </button>
              );
            })}
      </div>

      {!jobsLoading && jobs.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Briefcase className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa tìm thấy job phù hợp</h3>
          <p className="mt-2 text-sm text-slate-500">
            Thử đổi từ khóa hoặc trạng thái lọc để tìm tin tuyển dụng khác.
          </p>
        </div>
      ) : null}

      {totalJobPages > 1 ? (
        <div className="flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Trang <span className="font-semibold text-slate-900">{jobsPage}</span> / {totalJobPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(jobsPage - 1)}
              disabled={jobsPage === 1 || jobsLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(jobsPage + 1)}
              disabled={jobsPage === totalJobPages || jobsLoading}
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
