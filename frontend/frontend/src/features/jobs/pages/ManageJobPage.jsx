// src/pages/jobs/ManageJobPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MapPin,
  DollarSign,
  Users,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  FileText
} from "lucide-react";

// Import component TextInput của bạn
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import JobAPI from "@/features/jobs/JobAPI";

const PAGE_SIZE = 10;

// ==========================
//  HELPER FUNCTIONS
// ==========================

const getStatusBadge = (status) => {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Đang tuyển
        </span>
      );
    case "hidden":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Đang ẩn
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Đã đóng
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Hết hạn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          {status}
        </span>
      );
  }
};

const formatSalary = (job) => {
  const { salary_min, salary_max, negotiable } = job || {};
  if (negotiable) return "Thoả thuận";
  const hasMin = salary_min !== null && salary_min !== undefined;
  const hasMax = salary_max !== null && salary_max !== undefined;

  if (hasMin && hasMax) return `${salary_min} - ${salary_max} triệu`;
  if (hasMin) return `Từ ${salary_min} triệu`;
  if (hasMax) return `Đến ${salary_max} triệu`;
  return "—";
};

export default function ManageJobPage() {
  // ─────────────────────────────────────────
  // State
  // ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const navigate = useNavigate();

  // ─────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const currentPage = params.page || page || 1;
      const res = await JobAPI.getByCompany({
        page: currentPage,
        limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        ...params,
      });

      const data = res.data?.data || res.data || {};
      setJobs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách job:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  useEffect(() => {
    fetchData({ page: 1 });
    setPage(1);
  }, [filters.status]);

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (!e || e.key === "Enter") {
      setPage(1);
      fetchData({ page: 1 });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchData({ page: newPage });
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Quản lý tin tuyển dụng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi và quản lý các vị trí công việc bạn đang đăng tuyển.
            </p>
          </div>
          <Button
            variant="primary"
            className="flex items-center gap-2 shadow-sm shadow-indigo-200"
            onClick={() => navigate("/recruiter/jobs/create")}
          >
            <Plus className="w-5 h-5" />
            <span>Đăng tin mới</span>
          </Button>
        </div>

        {/* --- TOOLBAR (SEARCH & FILTER) --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            
            {/* Search Input using Custom TextInput Component */}
            <div className="relative w-full md:max-w-md group" onKeyDown={handleSearch}>
              {/* Icon Search nằm đè lên TextInput (Absolute) */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>

              {/* Component TextInput của bạn */}
              <TextInput 
                name="search"
                placeholder="Tìm kiếm theo tiêu đề công việc..."
                value={filters.search}
                onChange={handleChange}
                // Thêm padding-left (pl-11) để chữ không đè lên icon search
                className="pl-11" 
                width="full"
              />
            </div>

            {/* Filter Status */}
            <div className="w-full md:w-48">
              <SelectInput
                name="status"
                value={filters.status}
                onChange={handleChange}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "active", label: "Đang tuyển" },
                  { value: "hidden", label: "Đang ẩn" },
                  { value: "closed", label: "Đã đóng" },
                  { value: "expired", label: "Hết hạn" },
                ]}
                className="!bg-white !border-slate-200" 
              />
            </div>
            
            {/* Search Button */}
             <Button 
                onClick={() => handleSearch()} 
                variant="primary"
              >
                Tìm kiếm
            </Button>
          </div>

          {/* Stats Summary */}
          {!loading && (
             <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <span>Tổng cộng:</span>
                <span className="font-bold text-slate-900">{total}</span>
                <span>tin</span>
             </div>
          )}
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[40%]">
                    Công việc & Địa điểm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mức lương
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ứng tuyển
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  // Skeleton Loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-200 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : jobs.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                           <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-900 font-medium mb-1">Không tìm thấy tin tuyển dụng nào</p>
                        <p className="text-slate-500 text-sm mb-4">Thử thay đổi bộ lọc hoặc tạo tin mới.</p>
                        <Button variant="outline" size="sm" onClick={() => {
                          setFilters({ search: "", status: "" });
                          fetchData({ page: 1 });
                        }}>
                          Xóa bộ lọc
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  jobs.map((job) => {
                    const applicationsCount = job._count?.applications ?? 0;
                    return (
                      <tr 
                        key={job.id} 
                        onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                        className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        {/* Title & Location */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1" title={job.title}>
                              {job.title || "—"}
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{job.location_full || "Chưa cập nhật địa điểm"}</span>
                            </div>
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            {formatSalary(job)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getStatusBadge(job.status)}
                        </td>

                        {/* Applications */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                           <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-sm font-bold ${
                             applicationsCount > 0 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                           }`}>
                              <Users className="w-3.5 h-3.5" />
                              {applicationsCount}
                           </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-indigo-500">
                              <ChevronRight className="w-5 h-5" />
                           </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hiển thị trang <span className="font-semibold text-slate-700">{page}</span> trên <span className="font-semibold text-slate-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="white"
                  size="sm"
                  className="!px-2 border-slate-200 text-slate-600 disabled:opacity-50"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                 <div className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 shadow-sm">
                    {page}
                 </div>
                <Button
                  variant="white"
                  size="sm"
                  className="!px-2 border-slate-200 text-slate-600 disabled:opacity-50"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}