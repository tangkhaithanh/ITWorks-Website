import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Eye, Trash2, Bookmark, Loader2 } from "lucide-react";
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

export default function TalentPoolListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, meta, loading } = useSelector((state) => state.talentPool);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const loadPool = useCallback(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.tags) params.tags = filters.tags;
    params.page = filters.page;
    params.limit = filters.limit;
    dispatch(fetchTalentPool(params));
  }, [dispatch, filters]);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Xóa ${name || "ứng viên này"} khỏi kho ứng viên?`)) return;
    try {
      await dispatch(removeCandidate(id)).unwrap();
      toast.success("Đã xóa khỏi kho ứng viên.");
    } catch {
      toast.error("Không thể xóa ứng viên.");
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/recruiter/talent-pool/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho ứng viên</h1>
          <p className="mt-1 text-sm text-slate-500">
            {meta?.total || 0} ứng viên đã lưu
          </p>
        </div>
      </div>

      <SearchFilterBar
        filters={filters}
        onFilterChange={(f) => {
          setFilters({ ...f, page: 1 });
        }}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Chưa có ứng viên</h2>
          <p className="mt-2 text-sm text-slate-500">
            Lưu ứng viên từ kết quả matching để xây dựng kho ứng viên.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={
                      item.candidate?.user?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.candidate?.user?.full_name || "?")}&background=random`
                    }
                    alt={item.candidate?.user?.full_name || "Ứng viên"}
                    className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.candidate?.user?.full_name || `Ứng viên #${item.candidate_id}`}
                    </h3>
                    <CandidateInfoSummary candidate={item.candidate} compact />
                    <p className="text-sm text-slate-500">
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

          <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      )}
    </div>
  );
}
