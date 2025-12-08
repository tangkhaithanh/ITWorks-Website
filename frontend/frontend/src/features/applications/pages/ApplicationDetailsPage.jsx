// src/features/applications/pages/ApplicationDetailsPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// API & Components
import InterviewAPI from "../InterviewAPI";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import Button from "@/components/ui/Button";
import InterviewFormModal from "@/features/applications/components/InterviewFormModal";

// Icons (Lucide React - Cần cài đặt: npm install lucide-react)
// Nếu chưa cài, bạn có thể thay thế bằng SVG cũ, nhưng khuyến khích dùng Lucide để đẹp hơn.
import {
  User, Mail, Phone, Calendar, Clock, MapPin, Video,
  FileText, Download, Eye, Briefcase, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, MoreHorizontal,
  ExternalLink
} from "lucide-react";

const MySwal = withReactContent(Swal);

// --- HELPERS ---
const STATUS_CONFIG = {
  pending: { label: "Đang chờ xử lý", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  interviewing: { label: "Đang phỏng vấn", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Video },
  accepted: { label: "Đã chấp nhận", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Đã từ chối", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
  withdrawn: { label: "Đã rút đơn", color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle },
};

const INTERVIEW_STATUS_CONFIG = {
  scheduled: {
    label: "Đã lên lịch",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "ring-blue-500"
  },
  rescheduled: {
    label: "Đã dời lịch",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-500"
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-slate-50 text-slate-500 border-slate-200",
    ring: "ring-slate-400"
  },
  completed: {
    label: "Đã hoàn thành",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-500"
  },
};

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate(); // Thêm navigate để có nút quay lại

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [interviewModal, setInterviewModal] = useState({
    open: false,
    mode: "create",
    interview: null,
  });

  // FETCH DATA
  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await ApplicationAPI.getDetail(id);
      setApp(res.data?.data || null);
    } catch (err) {
      console.error(err);
      MySwal.fire("Lỗi", "Không tải được dữ liệu đơn ứng tuyển.", "error");
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const { candidate, job, cv, interviews = [], status, applied_at } = app || {};

  // Logic check active interview
  const hasActiveInterview = interviews.some(
    (itv) => itv.status === "scheduled" || itv.status === "rescheduled"
  );

  // --- ACTIONS ---
  const handleAccept = async () => {
    const confirm = await MySwal.fire({
      title: "Chấp nhận ứng viên?",
      text: "Ứng viên sẽ được chuyển sang trạng thái chính thức.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await ApplicationAPI.accept(id);
      await MySwal.fire("Thành công!", "Đã chấp nhận ứng viên.", "success");
      fetchDetail();
    } catch (err) {
      MySwal.fire("Lỗi", err.response?.data?.message || "Lỗi hệ thống", "error");
    }
  };

  const handleReject = async () => {
    const confirm = await MySwal.fire({
      title: "Từ chối ứng viên?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await ApplicationAPI.reject(id);
      await MySwal.fire("Đã từ chối", "Ứng viên đã bị từ chối.", "success");
      fetchDetail();
    } catch (err) {
      MySwal.fire("Lỗi", err.response?.data?.message || "Lỗi hệ thống", "error");
    }
  };

  const handleDownloadFileCv = async (cv) => {
    if (!cv?.file_url) return;
    try {
      const response = await fetch(cv.file_url, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cv.title || "cv.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.open(cv.file_url, "_blank");
    }
  };

  const handleViewFileCv = (cv) => {
    if (cv?.file_url) window.open(cv.file_url, "_blank");
  };

  const handleViewOnlineCv = () =>
    MySwal.fire({ title: "Thông báo", text: "Chức năng xem CV Online đang phát triển.", icon: "info" });

  const handleCancelInterview = async (interview) => {
    const confirm = await MySwal.fire({
      title: "Hủy lịch phỏng vấn?",
      text: "Trạng thái đơn sẽ quay về PENDING.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hủy lịch",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await InterviewAPI.cancel(interview.id);
      await MySwal.fire("Đã hủy", "Lịch phỏng vấn đã hủy thành công.", "success");
      fetchDetail();
    } catch (err) {
      MySwal.fire("Lỗi", err.response?.data?.message || "Lỗi hệ thống", "error");
    }
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = () => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const renderTopActions = () => {
    if (status === "pending") {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleReject} className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
            Từ chối
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setInterviewModal({ open: true, mode: "create", interview: null })}
            className="shadow-md shadow-blue-500/20"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Hẹn phỏng vấn
          </Button>
        </div>
      );
    }
    if (status === "interviewing") {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleReject} className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
            Từ chối
          </Button>
          <Button size="sm" variant="green" onClick={handleAccept} className="shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Chấp nhận
          </Button>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!app) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
      <Briefcase className="w-12 h-12 mb-2 opacity-50" />
      <p>Không tìm thấy dữ liệu.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* --- HEADER (Improved Design - No Job Title) --- */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* LEFT: Candidate Name + Meta */}
            <div className="flex items-start sm:items-center gap-4">

              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>

              <div className="flex flex-col gap-1">

                {/* Candidate Name */}
                <h1 className="text-xl font-bold text-slate-900">
                  {candidate?.full_name}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    #{app.id}
                  </span>

                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>

                  <span>Ứng tuyển: {dayjs(applied_at).format("DD/MM/YYYY")}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Status + Actions */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">

              {/* Status Badge */}
              <div className="flex items-center">
                {renderStatusBadge()}
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition"
                      onClick={handleReject}
                    >
                      Từ chối
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      className="shadow-md shadow-blue-500/20"
                      onClick={() =>
                        setInterviewModal({ open: true, mode: "create", interview: null })
                      }
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Hẹn phỏng vấn
                    </Button>
                  </>
                )}

                {status === "interviewing" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition"
                      onClick={handleReject}
                    >
                      Từ chối
                    </Button>

                    <Button
                      size="sm"
                      variant="green"
                      className="shadow-md shadow-emerald-500/20"
                      onClick={handleAccept}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Chấp nhận
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* --- LEFT COLUMN (2/3): TIMELINE & CV --- */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. INTERVIEW TIMELINE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Lịch trình phỏng vấn
                </h3>
                {(status === "pending" || status === "interviewing") && !hasActiveInterview && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setInterviewModal({ open: true, mode: "create", interview: null })}
                    className="bg-white"
                  >
                    + Thêm lịch
                  </Button>
                )}
              </div>

              <div className="p-6">
                {interviews.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-lg">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Chưa có lịch phỏng vấn nào.</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {interviews.map((itv) => {
                      const stConfig = INTERVIEW_STATUS_CONFIG[itv.status] || INTERVIEW_STATUS_CONFIG.scheduled;
                      return (
                        <div key={itv.id} className="relative flex items-start group">
                          {/* Dot */}
                          <div
                            className={`absolute left-0 top-0 mt-1 ml-[11px] h-4 w-4 rounded-full border-2 bg-white z-10 ${stConfig.ring ? stConfig.ring.replace("ring", "border") : ""}`}
                          />

                          {/* Content */}
                          <div className="ml-12 w-full">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group-hover:border-blue-200">
                              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                <div>
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    {itv.mode === "online" ? <Video className="w-4 h-4 text-purple-500" /> : <User className="w-4 h-4 text-orange-500" />}
                                    {itv.mode === "online" ? "Phỏng vấn Online" : "Phỏng vấn Trực tiếp"}
                                  </h4>
                                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {dayjs(itv.scheduled_at).format("DD/MM/YYYY")}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    {dayjs(itv.scheduled_at).format("HH:mm")}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${stConfig.color}`}>
                                  {stConfig.label}
                                </span>
                              </div>

                              {/* Details Box */}
                              <div className="bg-slate-50 rounded-md p-3 text-sm space-y-2 mb-3">
                                {itv.mode === "online" && itv.meeting_link && (
                                  <div className="flex gap-2 text-slate-700">
                                    <ExternalLink className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <a href={itv.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                                      {itv.meeting_link}
                                    </a>
                                  </div>
                                )}
                                {itv.mode === "offline" && itv.location && (
                                  <div className="flex gap-2 text-slate-700">
                                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span>{itv.location}</span>
                                  </div>
                                )}
                                {itv.notes && (
                                  <div className="flex gap-2 text-slate-600 italic">
                                    <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{itv.notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {itv.status !== "cancelled" && itv.status !== "completed" && status === "interviewing" && (
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => setInterviewModal({ open: true, mode: "edit", interview: itv })}
                                    className="text-xs font-medium text-slate-600 hover:text-blue-600 px-2 py-1"
                                  >
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    onClick={() => handleCancelInterview(itv)}
                                    className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1"
                                  >
                                    Hủy lịch
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. CV & DOCUMENTS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  CV & Hồ sơ đính kèm
                </h3>
              </div>
              <div className="p-6">
                {!cv ? (
                  <div className="text-slate-500 text-sm italic">Ứng viên chưa tải lên CV.</div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-red-500 border border-slate-100">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{cv.title || "Curriculum Vitae"}</p>
                        <p className="text-xs text-slate-500 uppercase">{cv.type === "online" ? "Online Profile" : "PDF Document"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cv.type === "file" ? (
                        <>
                          <Button size="xs" variant="white" onClick={() => handleViewFileCv(cv)} title="Xem trước">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button size="xs" variant="white" onClick={() => handleDownloadFileCv(cv)} title="Tải xuống">
                            <Download className="w-4 h-4 text-slate-600" />
                          </Button>
                        </>
                      ) : (
                        <Button size="xs" variant="primary" onClick={handleViewOnlineCv}>
                          Xem Online
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN (1/3): SIDEBAR INFO --- */}
          <div className="space-y-6">

            {/* CANDIDATE CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="px-6 pb-6 text-center -mt-10">
                <img
                  src={candidate?.avatar_url || "https://ui-avatars.com/api/?name=" + candidate?.full_name}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md mx-auto object-cover bg-white"
                />
                <h2 className="mt-3 text-lg font-bold text-slate-900">{candidate?.full_name}</h2>
                <p className="text-slate-500 text-sm">{candidate?.email}</p>

                <div className="mt-6 flex flex-col gap-3">
                  <a href={`mailto:${candidate?.email}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{candidate?.email}</p>
                    </div>
                  </a>

                  <a href={`tel:${candidate?.phone}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-200">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-400 font-bold uppercase">Phone</p>
                      <p className="text-sm font-medium text-slate-700">{candidate?.phone}</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* JOB INFO SUMMARY */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Thông tin vị trí</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Vị trí ứng tuyển</p>
                  <p className="font-medium text-slate-700">{job?.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Level</p>
                    <p className="font-medium text-slate-700">{Array.isArray(job?.experience_levels) ? job.experience_levels.join(", ") : "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hình thức</p>
                    <p className="font-medium text-slate-700">{Array.isArray(job?.work_modes) ? job.work_modes.join(", ") : "--"}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL */}
      <InterviewFormModal
        open={interviewModal.open}
        mode={interviewModal.mode}
        onClose={(saved) => {
          setInterviewModal({ open: false, mode: "create", interview: null });
          if (saved) fetchDetail();
        }}
        applicationId={id}
        interview={interviewModal.mode === "edit" ? interviewModal.interview : null}
      />
    </div>
  );
}