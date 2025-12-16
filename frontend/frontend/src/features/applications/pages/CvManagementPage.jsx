// src/pages/applications/CvManagementPage.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Users,
  User,
  Eye,
  ChevronRight,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  CalendarDays,
  Filter,
  ChevronDown,
  Check
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Components
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";

// APIs
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import JobAPI from "../../jobs/JobAPI";

const MySwal = withReactContent(Swal);

// ==========================
//  HELPER & SUB-COMPONENTS
// ==========================

// 1. Cắt chữ thông minh
const truncateText = (text, maxLength = 30) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// 2. Component Custom Dropdown cho Job (Giải pháp UX tối ưu)
function JobFilterDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tìm label của job đang chọn để hiển thị ra ngoài (Cắt ngắn)
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? truncateText(selectedOption.fullLabel, 35) : "Tất cả công việc";

  // Lọc danh sách job theo từ khóa tìm kiếm trong dropdown
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.fullLabel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* TRIGGER BUTTON (Luôn gọn gàng, fixed height) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-sm text-slate-700 hover:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
      >
        <span className="truncate mr-2" title={selectedOption?.fullLabel}>
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* DROPDOWN MENU (Rộng, hiển thị Full tên) */}
      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full sm:w-[350px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">

          {/* Search Box bên trong Dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm nhanh tên job..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange({ target: { name: "jobId", value: opt.value } });
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors flex items-start gap-2 mb-0.5 last:mb-0 ${String(value) === String(opt.value)
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  {/* Icon check nếu đang chọn */}
                  <div className={`mt-0.5 w-4 h-4 flex-shrink-0 flex items-center justify-center ${String(value) === String(opt.value) ? "opacity-100" : "opacity-0"}`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  {/* Tên Job Full (Whitespace normal để xuống dòng) */}
                  <span className="whitespace-normal leading-tight">
                    {opt.fullLabel}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy công việc</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// 3. Status Badge Helper
const getStatusConfig = (status) => {
  switch (status) {
    case "accepted":
      return {
        label: "Đã nhận",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        borderClass: "border-l-emerald-500"
      };
    case "rejected":
      return {
        label: "Từ chối",
        icon: <XCircle className="w-3.5 h-3.5" />,
        className: "bg-rose-50 text-rose-700 border-rose-200",
        borderClass: "border-l-rose-500"
      };
    case "interviewing":
      return {
        label: "Phỏng vấn",
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        borderClass: "border-l-indigo-500"
      };
    case "pending":
    default:
      return {
        label: "Đang chờ",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        borderClass: "border-l-amber-500"
      };
  }
};

// ==========================
//  MAIN COMPONENT
// ==========================

export default function CvManagementPage() {
  const navigate = useNavigate();

  // State
  const [filters, setFilters] = useState({
    search: "",
    jobId: "",
    status: "",
  });
  const [jobOptions, setJobOptions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingJob, setCheckingJob] = useState(true);
  const [hasJob, setHasJob] = useState(false);


  // APIs
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const res = await ApplicationAPI.getByCompany({
        page: 1,
        limit: 10,
        search: filters.search || undefined,
        jobId: filters.jobId ? Number(filters.jobId) : undefined,
        status: filters.status || undefined,
        ...params,
      });

      const data = res.data?.data || {};
      setApplications(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách ứng viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobOptions = async () => {
    try {
      setCheckingJob(true);
      const res = await JobAPI.getJobsForDropdown();
      const jobs = res.data?.data || [];

      setJobOptions(jobs);
      setHasJob(jobs.length > 0); // ⭐ QUAN TRỌNG
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách công việc:", err);
      setHasJob(false);
    } finally {
      setCheckingJob(false);
    }
  };


  useEffect(() => {
    fetchJobOptions();
  }, []);

  useEffect(() => {
    if (hasJob) {
      fetchData();
    }
  }, [hasJob, filters.jobId, filters.status]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (!e || e.key === "Enter") fetchData();
  };

  const handleViewCv = async (e, item) => {
    e.stopPropagation();
    try {
      const filename = item.cv?.file_public_id?.replace(/^cvs\//, "") || item.cv?.id;
      if (!filename) {
        return MySwal.fire({
          title: "Không tìm thấy CV",
          text: "Ứng viên chưa cập nhật CV.",
          icon: "warning",
          confirmButtonColor: "#4f46e5",
        });
      }
      MySwal.fire({
        title: "Đang tải CV...",
        didOpen: () => Swal.showLoading(),
      });
      const res = await CandidateAPI.viewCv(filename);
      Swal.close();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      Swal.close();
      MySwal.fire({ title: "Lỗi tải file", icon: "error" });
    }
  };

  // Prepare Dropdown Options (Giữ Full tên ở field khác)
  const jobDropdownData = [
    { value: "", fullLabel: "Tất cả công việc" },
    ...jobOptions.map((job) => ({
      value: String(job.id),
      fullLabel: job.title, // Giữ nguyên tên gốc để hiển thị trong list
    })),
  ];

  // Title Logic
  const selectedJob = jobOptions.find(job => String(job.id) === filters.jobId);
  const currentFilterLabel = selectedJob ? selectedJob.title : "Tất cả công việc";
  if (checkingJob) {
    return (
      <div className="p-8 text-center text-slate-500">
        Đang kiểm tra danh sách công việc...
      </div>
    );
  }
  if (!hasJob) {
    return (
      <div className="p-12 text-center text-slate-600">
        <p className="font-medium text-lg mb-2">
          Bạn chưa đăng tin tuyển dụng nào
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Vui lòng đăng ít nhất một tin tuyển dụng để bắt đầu quản lý hồ sơ ứng viên.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/recruiter/jobs")}
        >
          Đi tới trang đăng tin
        </Button>
      </div>
    );
  }
  // Render
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              Quản lý hồ sơ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sàng lọc và quản lý quy trình tuyển dụng.
            </p>
          </div>
          {!loading && (
            <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm text-slate-500">Tổng ứng viên:</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{total}</span>
            </div>
          )}
        </div>

        {/* --- TOOLBAR --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-20">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-grow lg:flex-[2] min-w-[240px] group" onKeyDown={handleSearch}>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <TextInput
                name="search"
                placeholder="Tìm kiếm theo tên, email..."
                value={filters.search}
                onChange={handleChange}
                className="pl-10 !w-full"
                width="full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 lg:flex-[3]">

              {/* Custom Job Dropdown */}
              <div className="flex-1 min-w-[200px]">
                <JobFilterDropdown
                  value={filters.jobId}
                  onChange={handleChange}
                  options={jobDropdownData}
                />
              </div>

              {/* Status Filter */}
              <div className="flex-1 min-w-[160px] sm:max-w-[200px]">
                <SelectInput
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Tất cả trạng thái" },
                    { value: "pending", label: "Đang chờ" },
                    { value: "interviewing", label: "Phỏng vấn" },
                    { value: "accepted", label: "Đã nhận" },
                    { value: "rejected", label: "Từ chối" },
                  ]}
                  className="!bg-white !border-slate-200 !w-full"
                />
              </div>

              {/* Submit Button */}
              <div className="sm:w-auto w-full">
                <Button
                  onClick={() => fetchData()}
                  variant="secondary"
                  className="w-full h-full min-h-[42px] px-6 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-medium whitespace-nowrap"
                >
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- SUMMARY INFO --- */}
        {!loading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 py-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2 text-sm text-slate-600 w-full overflow-hidden">
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span className="flex-shrink-0">Đang lọc theo:</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100 truncate" title={currentFilterLabel}>
                {currentFilterLabel}
              </span>
            </div>
            <div className="sm:hidden text-xs text-slate-500 font-medium text-right">
              {total} kết quả
            </div>
          </div>
        )}

        {/* --- CANDIDATE LIST --- */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 w-full space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-9 w-28 bg-slate-200 rounded" />
              </div>
            ))
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Chưa tìm thấy ứng viên nào</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
                Thử điều chỉnh từ khóa tìm kiếm hoặc thay đổi bộ lọc trạng thái.
              </p>
              <Button size="sm" variant="outline" onClick={() => {
                setFilters({ search: "", jobId: "", status: "" });
                fetchData();
              }}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            applications.map((item) => {
              const statusConfig = getStatusConfig(item.status);

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/recruiter/applications/${item.id}`)}
                  className={`group relative bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 cursor-pointer border-l-[3px] ${statusConfig.borderClass}`}
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.candidate?.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.candidate?.user?.full_name || "User")}&background=random`}
                          alt="avatar"
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-indigo-100 transition-all"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm sm:hidden text-[10px]`}>
                          {statusConfig.icon}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {item.candidate?.user?.full_name || "Ứng viên ẩn danh"}
                          </h3>
                          <div className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusConfig.className}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate font-medium text-slate-600" title={item.job?.title}>
                            {item.job?.title || "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date().toLocaleDateString('vi-VN')}
                          </span>
                          <span>•</span>
                          <span>ID: #{item.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      <div className={`sm:hidden text-xs font-semibold px-2 py-1 rounded bg-slate-50 border border-slate-100 text-slate-600`}>
                        {statusConfig.label}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200 shadow-sm h-9 px-3"
                          onClick={(e) => handleViewCv(e, item)}
                          title="Xem nhanh CV"
                        >
                          <Eye className="w-4 h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Xem CV</span>
                        </Button>

                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}