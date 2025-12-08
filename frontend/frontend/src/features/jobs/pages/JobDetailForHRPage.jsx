// src/features/jobs/pages/JobDetailForHRPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// UI Components
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { Card, CardBody } from "@/components/common/Card";
import TagList from "@/components/common/TagList";
import EmptyState from "@/components/common/EmptyState";

// Icons & API
import JobAPI from "@/features/jobs/JobAPI";
import {
  BarChart3,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Briefcase,
  ChevronLeft,
  Edit,
  Eye,
  EyeOff,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers
} from "lucide-react";

// =======================
//  Helpers & Constants
// =======================

const EMPLOYMENT_TYPE_LABELS = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
  freelance: "Freelance",
};

const WORK_MODE_LABELS = {
  onsite: "Tại văn phòng",
  remote: "Remote",
  hybrid: "Hybrid",
};

const EXPERIENCE_LEVEL_LABELS = {
  fresher: "Fresher",
  junior: "Junior",
  mid: "Middle",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};

const JOB_STATUS_META = {
  active: {
    label: "Đang tuyển",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20",
    icon: CheckCircle2,
  },
  hidden: {
    label: "Đang ẩn",
    className: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20",
    icon: EyeOff,
  },
  closed: {
    label: "Đã đóng",
    className: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
    icon: XCircle,
  },
  expired: {
    label: "Hết hạn",
    className: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20",
    icon: AlertCircle,
  },
};

const formatSalaryRange = (job) => {
  if (!job) return "—";
  if (job.negotiable) return "Thỏa thuận";

  const min = job.salary_min ? Number(job.salary_min) : null;
  const max = job.salary_max ? Number(job.salary_max) : null;

  if (min && max) return `${min} - ${max} tr`;
  if (min) return `Từ ${min} tr`;
  if (max) return `Tới ${max} tr`;
  return "—";
};

const formatDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return v;
  }
};

// =======================
//  MAIN COMPONENT
// =======================

export default function JobDetailForHRPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [extendError, setExtendError] = useState("");

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await JobAPI.getJobToEdit(id);
      setJob(res.data?.data || null);
    } catch (err) {
      console.error("Lỗi lấy job:", err);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleHide = async () => {
    const confirm = await Swal.fire({
      title: "Ẩn tin tuyển dụng?",
      text: "Ứng viên sẽ không tìm thấy công việc này nữa.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ẩn ngay",
      cancelButtonText: "Hủy",
      customClass: { confirmButton: "bg-slate-600" }
    });

    if (!confirm.isConfirmed) return;
    try {
      await JobAPI.hide(job.id);
      await fetchJob();
      Swal.fire({ icon: "success", title: "Đã ẩn job!", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể ẩn job." });
    }
  };

  const handleUnhide = async () => {
    const confirm = await Swal.fire({
      title: "Đăng lại tin?",
      text: "Job sẽ xuất hiện trở lại trên bảng tin.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Hiện ngay",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;
    try {
      await JobAPI.unhide(job.id);
      await fetchJob();
      Swal.fire({ icon: "success", title: "Job đã hiển thị!", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể hiện lại job." });
    }
  };

  const handleClose = async () => {
    const confirm = await Swal.fire({
      title: "Đóng tuyển dụng?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đóng job",
      confirmButtonColor: "#e11d48",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;
    try {
      await JobAPI.close(job.id);
      await fetchJob();
      Swal.fire({ icon: "success", title: "Đã đóng job!", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể đóng job." });
    }
  };

  const handleExtend = () => {
    setExtendError("");
    setNewDeadline("");
    setExtendOpen(true);
  };

  const handleSubmitExtend = async () => {
    if (!newDeadline) {
      setExtendError("Vui lòng chọn ngày gia hạn");
      return;
    }
    const today = new Date();
    const picked = new Date(newDeadline + "T00:00:00");

    if (picked <= today) {
      setExtendError("Ngày mới phải lớn hơn hôm nay");
      return;
    }

    try {
      await JobAPI.resetDeadline(job.id, { newDeadline });
      setExtendOpen(false);
      await fetchJob();
      Swal.fire({ icon: "success", title: "Gia hạn thành công!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể gia hạn" });
    }
  };

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
      Đang tải dữ liệu...
    </div>
  );

  if (!job) return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-slate-300" />
      <h2 className="text-lg font-semibold text-slate-700">Không tìm thấy công việc</h2>
      <Button size="sm" variant="outline" onClick={() => navigate("/recruiter/jobs")}>
        Quay lại danh sách
      </Button>
    </div>
  );

  // --- DATA PREPARATION ---
  const StatusIcon = JOB_STATUS_META[job.status]?.icon || AlertCircle;
  const statusMeta = JOB_STATUS_META[job.status] || JOB_STATUS_META.hidden;
  const experienceLevels = (job.experience_levels || []).map((e) => EXPERIENCE_LEVEL_LABELS[e] || e);
  const workModes = (job.work_modes || []).map((w) => WORK_MODE_LABELS[w] || w);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-600">

      {/* 1. COMPACT HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          {/* Top Row: Back link & ID */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate("/recruiter/jobs")}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Quay lại
            </button>
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">JOB ID: #{job.id}</span>
          </div>

          {/* Main Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 line-clamp-1" title={job.title}>
                  {job.title}
                </h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${statusMeta.className}`}>
                  <StatusIcon className="h-3 w-3" /> {statusMeta.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{job.company?.name}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Cập nhật: {formatDate(job.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                variant="white"
                size="sm"
                onClick={() => navigate(`/recruiter/jobs/${job.id}/dashboard`)}
                className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Thống kê
              </Button>

              {job.status !== "closed" && (
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                  className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                >
                  <Edit className="h-3.5 w-3.5" /> Sửa tin
                </Button>
              )}

              {/* Action Group */}
              <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

              {job.status === "hidden" && (
                <button onClick={handleUnhide} className="h-8 w-8 flex items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all" title="Hiện tin">
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {job.status === "active" && (
                <button onClick={handleHide} className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all" title="Ẩn tin">
                  <EyeOff className="h-4 w-4" />
                </button>
              )}
              {job.status === "expired" && (
                <Button size="sm" variant="green" onClick={handleExtend} className="h-8 text-xs gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Gia hạn
                </Button>
              )}
              {job.status === "active" && (
                <button onClick={handleClose} className="h-8 w-8 flex items-center justify-center rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all" title="Đóng job">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* 2. TOP GRID: 4 KEY BLOCKS (Horizontal) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* CARD 1: SALARY */}
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 bg-emerald-100/50 rounded-full blur-xl group-hover:bg-emerald-200/50 transition-all"></div>
            <CardBody className="p-4 relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Mức lương</span>
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-slate-900">{formatSalaryRange(job)}</p>
                {job.negotiable && <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Có thể thương lượng</p>}
              </div>
            </CardBody>
          </Card>

          {/* CARD 2: OVERVIEW */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardBody className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tổng quan</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Hạn nộp:</span>
                  <span className={`font-semibold ${job.status === 'expired' ? 'text-red-500' : 'text-slate-700'}`}>
                    {job.deadline ? formatDate(job.deadline) : "Vô thời hạn"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Hình thức:</span>
                  <span className="font-medium text-slate-700">{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Chế độ:</span>
                  <div className="flex gap-1">
                    {workModes.slice(0, 2).map(m => (
                      <span key={m} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">{m}</span>
                    ))}
                    {workModes.length > 2 && <span className="text-[10px] text-slate-400">+{workModes.length - 2}</span>}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* CARD 3: CRITERIA */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardBody className="p-4 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-purple-50 rounded text-purple-600">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tiêu chí</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Cấp bậc</span>
                  {experienceLevels.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {experienceLevels.slice(0, 3).map((l, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded border border-purple-100 bg-purple-50 text-purple-700 text-[10px] font-medium">{l}</span>
                      ))}
                    </div>
                  ) : <span className="text-xs text-slate-400 italic">Không yêu cầu</span>}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Kỹ năng chính</span>
                  {job.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">{s}</span>
                      ))}
                      {job.skills.length > 3 && <span className="text-[10px] text-slate-400 px-1">...</span>}
                    </div>
                  ) : <span className="text-xs text-slate-400 italic">--</span>}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* CARD 4: LOCATION */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardBody className="p-4 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-red-50 rounded text-red-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Địa điểm</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                  {job.location?.full || job.location_full || "Chưa cập nhật chi tiết"}
                </p>
                {(job.location_district || job.location_city) && (
                  <p className="text-slate-400 flex items-center gap-1 pt-1">
                    <span className="block h-1 w-1 rounded-full bg-slate-300"></span>
                    {[job.location_district, job.location_city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </section>

        {/* 3. BOTTOM SECTION: DETAILS (Vertical Stack for long text) */}
        <section className="space-y-6">

          {/* Description */}
          <Card className="border-slate-200 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase">Mô tả công việc</h3>
            </div>
            <CardBody className="p-5">
              {job.description ? (
                <div className="prose prose-sm prose-slate max-w-none 
                    prose-p:text-slate-600 prose-p:text-sm prose-p:leading-relaxed
                    prose-li:text-slate-600 prose-li:text-sm
                    prose-headings:text-slate-800 prose-headings:text-sm prose-headings:font-bold"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <EmptyState message="Chưa có nội dung mô tả" />
              )}
            </CardBody>
          </Card>

          {/* Requirements */}
          <Card className="border-slate-200 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase">Yêu cầu ứng viên</h3>
            </div>
            <CardBody className="p-5">
              {job.requirements ? (
                <div className="prose prose-sm prose-slate max-w-none
                    prose-p:text-slate-600 prose-p:text-sm prose-p:leading-relaxed
                    prose-li:text-slate-600 prose-li:text-sm
                    prose-headings:text-slate-800 prose-headings:text-sm prose-headings:font-bold"
                  dangerouslySetInnerHTML={{ __html: job.requirements }}
                />
              ) : (
                <EmptyState message="Chưa có nội dung yêu cầu" />
              )}
            </CardBody>
          </Card>

        </section>
      </main>

      {/* EXTEND MODAL */}
      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Gia hạn tuyển dụng"
        width="max-w-sm"
      >
        <div className="p-1">
          <p className="text-xs text-slate-500 mb-4">
            Chọn ngày kết thúc mới cho chiến dịch tuyển dụng này.
          </p>
          <DatePickerInput
            label="Deadline mới"
            name="newDeadline"
            value={newDeadline}
            onChange={(e) => {
              setNewDeadline(e.target.value);
              setExtendError("");
            }}
            placeholderText="Chọn ngày..."
            required
            error={extendError}
            minDate={new Date()}
          />

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
            <Button size="sm" variant="ghost" onClick={() => setExtendOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" variant="green" onClick={handleSubmitExtend}>
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}