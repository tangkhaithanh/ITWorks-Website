import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import {
  Search,
  Filter,
  Calendar,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle
} from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PAGE_SIZE = 9; // 9 cards cho grid 3 cột đẹp hơn

const getStatusInfo = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Đang chờ",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        dotColor: "bg-amber-500",
      };
    case "interviewing":
      return {
        label: "Phỏng vấn",
        icon: AlertCircle,
        className: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-500",
      };
    case "accepted":
      return {
        label: "Đã nhận",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotColor: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: "Từ chối",
        icon: XCircle,
        className: "bg-rose-50 text-rose-700 border-rose-200",
        dotColor: "bg-rose-500",
      };
    case "withdrawn":
      return {
        label: "Đã rút",
        icon: MinusCircle,
        className: "bg-slate-100 text-slate-600 border-slate-200",
        dotColor: "bg-slate-400",
      };
    default:
      return {
        label: status || "Không rõ",
        icon: AlertCircle,
        className: "bg-slate-50 text-slate-700 border-slate-200",
        dotColor: "bg-slate-400",
      };
  }
};

// Component: Application Card
const ApplicationCard = ({ app, onClick }) => {
  const { label, icon: StatusIcon, className, dotColor } = getStatusInfo(app.status);

  return (
      <div
          onClick={onClick}
          className="group relative bg-white rounded-2xl border border-slate-200
                 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10
                 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0
                      group-hover:from-blue-50/50 group-hover:to-indigo-50/30
                      transition-all duration-300 rounded-2xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header: Logo & Company */}
          <div className="flex items-start gap-4 mb-4">
            {/* Company Logo */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-slate-100
                          bg-white shadow-sm overflow-hidden group-hover:border-blue-200
                          transition-colors">
              <img
                  src={app.job?.company?.logo_url || "https://via.placeholder.com/64"}
                  className="w-full h-full object-contain p-2"
                  alt={app.job?.company?.name}
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Job Title */}
              <h3 className="font-bold text-slate-900 text-base leading-snug mb-1.5
                           line-clamp-2 group-hover:text-blue-600 transition-colors">
                {app.job?.title}
              </h3>

              {/* Company Name */}
              <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium truncate">{app.job?.company?.name}</span>
              </div>

              {/* Location */}
              {app.job?.location_city && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.job?.location_city}</span>
                  </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                           text-xs font-semibold border ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
            {label}
          </span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-4" />

          {/* Footer: Date & Action */}
          <div className="flex items-center justify-between">
            {/* Applied Date */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">
              {dayjs(app.applied_at).format("DD/MM/YYYY")}
            </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">
              {dayjs(app.applied_at).fromNow()}
            </span>
            </div>

            {/* View Details Arrow */}
            <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm
                          group-hover:gap-2 transition-all">
              <span>Chi tiết</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Hot/New Badge (Optional) */}
        {dayjs().diff(dayjs(app.applied_at), 'day') < 3 && (
            <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500
                         text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            <TrendingUp className="w-3 h-3" />
            Mới
          </span>
            </div>
        )}
      </div>
  );
};

// Component: Empty State
const EmptyState = ({ onReset }) => {
  return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Không tìm thấy đơn ứng tuyển
          </h3>
          <p className="text-slate-500 mb-6">
            Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
          </p>
          <Button
              onClick={onReset}
              variant="outline"
              className="inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>
  );
};

// Component: Loading Skeleton
const LoadingSkeleton = () => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-lg w-24 mb-4" />
              <div className="border-t border-slate-100 my-4" />
              <div className="flex justify-between">
                <div className="h-3 bg-slate-100 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            </div>
        ))}
      </div>
  );
};

// MAIN COMPONENT
export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const limit = PAGE_SIZE;

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const currentPage = params.page || page || 1;

      const res = await ApplicationAPI.getMyApplications({
        page: currentPage,
        limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
        ...params,
      });

      const data = res.data?.data || res.data || {};
      const pagination = data.pagination || {};

      setApplications(data.items || []);
      setTotal(pagination.total ?? data.total ?? 0);
      setPage(pagination.page ?? data.page ?? currentPage);
      setTotalPages(pagination.pages ?? data.pages ?? 1);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách đơn ứng tuyển:", err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData({ page: 1 });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (!e || e.key === "Enter") {
      fetchData({ page: 1 });
      setPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    fetchData({ page: newPage });
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setFilters({ search: "", status: "" });
    fetchData({ page: 1, status: "", search: "" });
    setPage(1);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

          {/* ========== HEADER ========== */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Đơn ứng tuyển của tôi
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Theo dõi và quản lý tất cả các đơn ứng tuyển của bạn
                </p>
              </div>
            </div>
          </div>

          {/* ========== FILTER BAR ========== */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Bộ lọc tìm kiếm</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Input */}
              <div className="md:col-span-6 lg:col-span-7 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <TextInput
                    name="search"
                    placeholder="Tìm kiếm theo tên công việc, công ty..."
                    value={filters.search}
                    onChange={handleChange}
                    onKeyDown={handleSearch}
                    className="!pl-10 !h-11 !text-sm !rounded-xl w-full bg-slate-50 border-slate-200
                         focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Status Select */}
              <div className="md:col-span-4 lg:col-span-3">
                <SelectInput
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "Tất cả trạng thái" },
                      { value: "pending", label: "⏳ Đang chờ" },
                      { value: "interviewing", label: "💼 Phỏng vấn" },
                      { value: "accepted", label: "✅ Đã nhận" },
                      { value: "rejected", label: "❌ Từ chối" },
                      { value: "withdrawn", label: "⛔ Đã rút" },
                    ]}
                    className="!h-11 !rounded-xl border-slate-200 text-sm font-medium w-full
                         focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Search Button */}
              <div className="md:col-span-2 lg:col-span-2">
                <Button
                    onClick={() => handleSearch()}
                    variant="primary"
                    className="w-full !h-11 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30
                         hover:shadow-xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search || filters.status) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Đang lọc:</span>
                  {filters.search && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs
                               font-medium px-2.5 py-1 rounded-lg border border-blue-200">
                  "{filters.search}"
                </span>
                  )}
                  {filters.status && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs
                               font-medium px-2.5 py-1 rounded-lg border border-blue-200">
                  {getStatusInfo(filters.status).label}
                </span>
                  )}
                  <button
                      onClick={handleResetFilters}
                      className="ml-auto text-xs text-slate-500 hover:text-red-600 font-medium
                         inline-flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Xóa bộ lọc
                  </button>
                </div>
            )}
          </div>

          {/* ========== APPLICATIONS GRID ========== */}
          {loading ? (
              <LoadingSkeleton />
          ) : applications.length === 0 ? (
              <EmptyState onReset={handleResetFilters} />
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {applications.map((app) => (
                      <ApplicationCard
                          key={app.id}
                          app={app}
                          onClick={() => navigate(`/my-applications/${app.id}`)}
                      />
                  ))}
                </div>

                {/* ========== PAGINATION ========== */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-12">
                      <nav className="inline-flex items-center p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm gap-1">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600
                             hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30
                             disabled:cursor-not-allowed transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="px-6 font-bold text-sm text-slate-700">
                          Trang {page} <span className="text-slate-400 font-normal mx-1">trong</span> {totalPages}
                        </div>

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600
                             hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30
                             disabled:cursor-not-allowed transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
}
