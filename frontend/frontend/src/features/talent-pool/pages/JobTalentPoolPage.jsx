import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Eye, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import JobAPI from "@/features/jobs/JobAPI";
import {
  fetchTalentPool,
  removeCandidate,
} from "@/features/talent-pool/talentPoolSlice";
import SearchFilterBar from "@/features/talent-pool/components/SearchFilterBar";
import Pagination from "@/features/talent-pool/components/Pagination";
import CandidateInfoSummary from "@/features/talent-pool/components/CandidateInfoSummary";
import Button from "@/components/ui/Button";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  priority: "",
  tags: "",
  page: 1,
  limit: 20,
};

function buildParams(jobId, filters) {
  const params = {
    jobId,
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.tags) params.tags = filters.tags;

  return params;
}

export default function JobTalentPoolPage() {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, meta, loading, error } = useSelector((state) => state.talentPool);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);

  const hasActiveFilters = useMemo(
    () => Boolean(filters.search || filters.status || filters.priority || filters.tags),
    [filters]
  );

  const loadJob = useCallback(async () => {
    setJobLoading(true);
    setJobError(null);
    try {
      const response = await JobAPI.getDetail(jobId);
      setJob(response.data);
    } catch (err) {
      const status = err?.response?.status;
      setJobError(
        status === 403
          ? "Bạn không có quyền xem kho ứng viên của job này."
          : status === 404
            ? "Không tìm thấy job."
            : "Không thể tải thông tin job."
      );
    } finally {
      setJobLoading(false);
    }
  }, [jobId]);

  const loadPool = useCallback(() => {
    if (!jobId || jobError) return;
    dispatch(fetchTalentPool(buildParams(jobId, filters)));
  }, [dispatch, filters, jobError, jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Xóa ${name || "ứng viên này"} khỏi kho ứng viên của job này?`)) return;
    try {
      await dispatch(removeCandidate(id)).unwrap();
      toast.success("Đã xóa khỏi kho ứng viên của job.");
      loadPool();
    } catch {
      toast.error("Không thể xóa ứng viên.");
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/recruiter/talent-pool/${id}`, {
      state: { backTo: `/recruiter/jobs/${jobId}/talent-pool` },
    });
  };

  const handleRetry = () => {
    if (jobError) {
      loadJob();
      return;
    }
    loadPool();
  };

  const pageTitle = job?.title || `Job #${jobId}`;
  const backTo = location.state?.backTo || `/recruiter/jobs/${jobId}`;
  const backLabel = location.state?.backLabel || "Job";
  const listError =
    typeof error === "string"
      ? error
      : error?.message || error?.error || null;

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="space-y-6">
        <Button size="sm" variant="outline" onClick={() => navigate(backTo)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <div className="rounded-[1.5rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{jobError}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Không hiển thị dữ liệu ứng viên cho job này.
          </p>
          <Button size="sm" className="mt-5" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Button size="sm" variant="outline" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <h1 className="mt-4 truncate text-2xl font-bold text-slate-900">
            Kho ứng viên: {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {meta?.total || 0} ứng viên đã lưu cho job này
          </p>
        </div>
      </div>

      <SearchFilterBar
        filters={filters}
        onFilterChange={(nextFilters) => {
          setFilters({ ...nextFilters, page: 1 });
        }}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : listError ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Không thể tải kho ứng viên của job này</h2>
          <p className="mt-2 text-sm text-slate-500">{listError}</p>
          <Button size="sm" className="mt-5" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {hasActiveFilters
              ? "Không có ứng viên phù hợp với bộ lọc"
              : "Chưa có ứng viên nào được lưu cho job này"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {hasActiveFilters
              ? "Điều chỉnh hoặc đặt lại bộ lọc để xem ứng viên đã lưu."
              : "Lưu ứng viên từ kết quả matching để xây dựng kho ứng viên cho job này."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <img
                    src={
                      item.candidate?.user?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        item.candidate?.user?.full_name || "?"
                      )}&background=random`
                    }
                    alt={item.candidate?.user?.full_name || "Ứng viên"}
                    className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-900">
                      {item.candidate?.user?.full_name || `Ứng viên #${item.candidate_id}`}
                    </h3>
                    <CandidateInfoSummary candidate={item.candidate} compact />
                    <p className="mt-1 text-sm text-slate-500">
                      {item.match_score !== null
                        ? `Điểm phù hợp: ${Math.round(item.match_score * 100)}%`
                        : "Chưa có điểm phù hợp"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {item.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.priority === "HIGH"
                            ? "bg-red-50 text-red-700"
                            : item.priority === "MEDIUM"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {item.priority}
                      </span>
                      {(item.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetail(item.id)}
                  >
                    <Eye className="h-4 w-4" />
                    Xem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    onClick={() =>
                      handleRemove(item.id, item.candidate?.user?.full_name)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination
            meta={meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      )}
    </div>
  );
}
