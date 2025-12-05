import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";
import ApplicationAPI from "@/features/applications/ApplicationAPI";

const PAGE_SIZE = 8; // Card to nên giảm số lượng mỗi trang xuống 8 hoặc 10 cho đẹp

const getStatusInfo = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Đang chờ",
        className: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",
      };
    case "interviewing":
      return {
        label: "Phỏng vấn",
        className: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
      };
    case "accepted":
      return {
        label: "Đã nhận",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
      };
    case "rejected":
      return {
        label: "Đã từ chối",
        className: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-100",
      };
    case "withdrawn":
      return {
        label: "Đã rút đơn",
        className: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-100",
      };
    default:
      return {
        label: status || "Không rõ",
        className: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-100",
      };
  }
};

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
  const [loading, setLoading] = useState(true); // Mặc định true để hiện Skeleton ngay

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
      // Thêm chút delay nhỏ nếu mạng quá nhanh để tránh giật lag UI (optional)
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
    // Scroll lên đầu trang khi chuyển trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50/50">
    
    {/* ========== 1. HEADER SECTION ========== */}
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Đơn ứng tuyển của tôi
      </h1>
      <p className="text-slate-500 text-sm mt-2">
        Quản lý tất cả {total > 0 && <span className="font-semibold text-blue-600">{total}</span>} vị trí bạn đã ứng tuyển.
      </p>
    </div>

    {/* ========== 2. FILTER BAR (Size Chuẩn - h-11) ========== */}
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* A. Search */}
        <div className="md:col-span-6 lg:col-span-7 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          </div>
          <TextInput
            name="search"
            placeholder="Tìm kiếm theo tên công việc, công ty..."
            value={filters.search}
            onChange={handleChange}
            onKeyDown={handleSearch}
            // h-11 là kích thước vừa vặn nhất
            className="!pl-10 !h-11 !text-sm !rounded-xl w-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
        </div>

        {/* B. Select */}
        <div className="md:col-span-4 lg:col-span-3">
          <SelectInput
            name="status"
            value={filters.status}
            onChange={handleChange}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "pending", label: "Đang chờ" },
              { value: "interviewing", label: "Đang phỏng vấn" },
              { value: "accepted", label: "Đã nhận việc" },
              { value: "rejected", label: "Đã từ chối" },
              { value: "withdrawn", label: "Đã rút đơn" },
            ]}
            className="!h-11 !rounded-xl border-slate-200 text-sm font-medium w-full"
          />
        </div>

        {/* C. Button */}
        <div className="md:col-span-2 lg:col-span-2">
          <Button
            onClick={() => handleSearch()}
            variant="primary"
            className="w-full !h-11 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          >
            Tìm kiếm
          </Button>
        </div>
      </div>
    </div>

    {/* ========== 3. MAIN CONTENT (GRID 3 CỘT - BALANCED) ========== */}
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-48 animate-pulse flex flex-col justify-between">
               <div className="flex gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl"></div>
                  <div className="flex-1 space-y-2 py-1">
                     <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                     <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔍
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Không tìm thấy kết quả</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Thử thay đổi bộ lọc tìm kiếm của bạn</p>
          <Button onClick={() => setFilters({search: "", status: ""})} variant="outline" size="sm">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        // Grid 3 columns nhưng gap rộng hơn (gap-6) và card thoáng hơn
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => {
            const { label, className } = getStatusInfo(app.status);
            return (
              <div
                key={app.id}
                onClick={() => navigate(`/my-applications/${app.id}`)}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
              >
                {/* Header: Logo & Title */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Logo w-14 (56px) - Vừa vặn */}
                  <div className="flex-shrink-0 border border-slate-100 bg-white rounded-xl p-2 w-14 h-14 flex items-center justify-center shadow-sm">
                     <img 
                       src={app.job?.company?.logo_url || "https://via.placeholder.com/56"} 
                       className="w-full h-full object-contain rounded-md" 
                       alt="logo"
                     />
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Title text-lg (To hơn bản compact, nhỏ hơn bản đầu) */}
                    <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {app.job?.title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 truncate font-medium">
                      {app.job?.company?.name}
                    </p>
                  </div>
                </div>

                {/* Status Badge - Đặt ở giữa cho thoáng */}
                <div className="mb-4">
                   <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${className}`}>
                      {label}
                   </span>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 mt-auto mb-3"></div>

                {/* Footer: Date & Link */}
                <div className="flex justify-between items-center text-sm">
                   <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {dayjs(app.applied_at).format("DD/MM/YYYY")}
                   </div>
                   
                   <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                     Xem chi tiết <span className="text-lg leading-none">&rsaquo;</span>
                   </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========== 4. PAGINATION ========== */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-10">
          <nav className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-sm gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="px-4 font-semibold text-sm text-slate-700">
              {page} <span className="text-slate-400 mx-1">/</span> {totalPages}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  </div>
);
}