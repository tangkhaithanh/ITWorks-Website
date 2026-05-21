// src/features/applications/pages/ApplicationDetailsPage.jsx

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import InterviewAPI from "../InterviewAPI";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import JobOfferAPI from "@/features/applications/JobOfferAPI";
import MessagingAPI from "@/features/messaging/MessagingAPI";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import InterviewFormModal from "@/features/applications/components/InterviewFormModal";
import JobOfferFormModal from "@/features/applications/components/JobOfferFormModal";
import JoditEditor from "jodit-react";

import {
  User, Mail, Phone, Calendar, Clock, MapPin, Video,
  FileText, Download, Eye, Briefcase, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, ExternalLink, MessageCircle,
} from "lucide-react";

const MySwal = withReactContent(Swal);

// --- HELPERS ---
const hasMeaningfulHtmlContent = (html) => {
  if (typeof html !== "string") return false;
  const sanitized = DOMPurify.sanitize(html);
  const parsed = new DOMParser().parseFromString(sanitized, "text/html");
  return Boolean(parsed.body.textContent?.replace(/\u00a0/g, " ").trim());
};

const STATUS_CONFIG = {
  pending:      { label: "Đang chờ xử lý", color: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock        },
  interviewing: { label: "Đang phỏng vấn", color: "bg-blue-100 text-blue-700 border-blue-200",       icon: Video        },
  offered:      { label: "Đã gửi đề nghị", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Briefcase    },
  accepted:     { label: "Đã chấp nhận",   color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected:     { label: "Đã từ chối",     color: "bg-rose-100 text-rose-700 border-rose-200",       icon: XCircle      },
  withdrawn:    { label: "Đã rút đơn",     color: "bg-slate-100 text-slate-600 border-slate-200",    icon: AlertCircle  },
};

const INTERVIEW_STATUS_CONFIG = {
  scheduled:   { label: "Đã lên lịch",  color: "bg-blue-50 text-blue-700 border-blue-200",     ring: "border-blue-500"   },
  rescheduled: { label: "Đã dời lịch",  color: "bg-amber-50 text-amber-700 border-amber-200",  ring: "border-amber-500"  },
  cancelled:   { label: "Đã hủy",       color: "bg-slate-50 text-slate-500 border-slate-200",  ring: "border-slate-400"  },
  completed:   { label: "Đã hoàn thành",color: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "border-emerald-500" },
  no_show:     { label: "Không tham gia", color: "bg-rose-50 text-rose-700 border-rose-200",   ring: "border-rose-500"   },
};

const INTERVIEW_RESULT_CONFIG = {
  pass:    { label: "Trúng tuyển", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reject:  { label: "Từ chối",     color: "bg-rose-50 text-rose-700 border-rose-200" },
  hold:    { label: "Tạm giữ",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Chưa có kết quả", color: "bg-slate-50 text-slate-500 border-slate-200" },
};

const INTERVIEW_RESULT_OPTIONS = [
  { value: "pass",   label: "Trúng tuyển" },
  { value: "reject", label: "Từ chối"     },
];

const formatOfferDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const formatOfferSalary = (salary, currency) => {
  if (salary === null || salary === undefined || salary === "" || !currency) {
    return "Negotiable";
  }

  const numericSalary = Number(salary);
  const formattedSalary = Number.isFinite(numericSalary)
    ? new Intl.NumberFormat("vi-VN").format(numericSalary)
    : salary;

  return `${formattedSalary} ${currency}`;
};

const formatOfferTextValue = (value) => {
  if (!value) return "--";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const RESULT_NOTES_EDITOR_CONFIG = {
  readonly: false,
  height: 260,
  placeholder: "Nhập ghi chú kết quả phỏng vấn...",
  buttons: [
    "bold", "italic", "underline", "strikethrough", "|",
    "ul", "ol", "|", "link", "|", "align", "|",
    "undo", "redo", "|", "hr", "eraser",
  ],
};

const INITIAL_RESULT_MODAL = {
  open: false,
  interview: null,
  submitting: false,
  form: { result: "pass", notes: "" },
};

// --- COMPONENT ---
export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resultNotesEditorRef = useRef(null);

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [interviewModal, setInterviewModal] = useState({ open: false, mode: "create", interview: null });
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [viewOfferLoading, setViewOfferLoading] = useState(false);
  const [viewOfferModal, setViewOfferModal] = useState({ open: false, offer: null });
  const [resultModal, setResultModal] = useState(INITIAL_RESULT_MODAL);

  // --- DATA FETCHING ---
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

  useEffect(() => { fetchDetail(); }, [id]);

  // --- EARLY RETURNS ---
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!app) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
      <Briefcase className="w-12 h-12 mb-2 opacity-50" />
      <p>Không tìm thấy dữ liệu.</p>
    </div>
  );

  // Destructure sau khi đã chắc chắn app != null
  const { candidate, job, cv, interviews = [], status, applied_at, cover_letter } = app;

  const sanitizedCoverLetter = typeof cover_letter === "string" ? DOMPurify.sanitize(cover_letter) : "";
  const shouldShowCoverLetter = hasMeaningfulHtmlContent(sanitizedCoverLetter);
  const hasActiveInterview = interviews.some((itv) => ["scheduled", "rescheduled"].includes(itv.status));
  const hasPassedInterview = interviews.some((itv) => itv.status === "completed" && itv.result === "pass");
  const isPendingApplication = status === "pending";
  const canSendOffer = hasPassedInterview && status === "interviewing";
  const canViewOffer = status === "offered";
  const currentOffer = viewOfferModal.offer;
  const sanitizedOfferMessage = typeof currentOffer?.message === "string"
    ? DOMPurify.sanitize(currentOffer.message)
    : "";
  const hasOfferMessage = hasMeaningfulHtmlContent(sanitizedOfferMessage);
  const offerInfoItems = currentOffer ? [
    { label: "Salary", value: formatOfferSalary(currentOffer.salary, currentOffer.currency) },
    { label: "Employment type", value: formatOfferTextValue(currentOffer.employment_type) },
    { label: "Expiration date", value: formatOfferDateTime(currentOffer.expires_at) },
    { label: "Offer status", value: formatOfferTextValue(currentOffer.status) },
    { label: "Created date", value: formatOfferDateTime(currentOffer.created_at) },
  ] : [];

  // --- ACTIONS ---
  const handleChatCandidate = async () => {
    if (!job?.id || !candidate?.account_id) {
      toast.error("Thiếu thông tin để mở chat.");
      return;
    }
    try {
      setActionLoading(true);
      await MessagingAPI.start(job.id, candidate.account_id);
      toast.success("Đã mở cuộc hội thoại");
      navigate("/recruiter/messages");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể mở chat");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOffer = async () => {
    try {
      setViewOfferLoading(true);
      const res = await JobOfferAPI.getByApplicationId(app.id ?? id);
      const payload = res.data?.data ?? res.data;
      const offer = Array.isArray(payload) ? payload[0] : payload;

      if (!offer) {
        toast.error("No offer found for this application.");
        return;
      }

      setViewOfferModal({ open: true, offer });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Unable to load offer details.");
    } finally {
      setViewOfferLoading(false);
    }
  };

  const handleReject = async () => {
    const { isConfirmed } = await MySwal.fire({
      title: "Từ chối ứng viên?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed) return;

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
      const blob = await fetch(cv.file_url, { mode: "cors" }).then((r) => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: cv.title || "cv.pdf" });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(cv.file_url, "_blank");
    }
  };

  const handleCancelInterview = async (interview) => {
    const { isConfirmed } = await MySwal.fire({
      title: "Hủy lịch phỏng vấn?",
      text: "Trạng thái đơn sẽ quay về PENDING.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hủy lịch",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      await InterviewAPI.cancel(interview.id);
      await MySwal.fire("Đã hủy", "Lịch phỏng vấn đã hủy thành công.", "success");
      fetchDetail();
    } catch (err) {
      MySwal.fire("Lỗi", err.response?.data?.message || "Lỗi hệ thống", "error");
    }
  };

  const handleSubmitInterviewResult = async () => {
    if (!resultModal.interview?.id) return;
    try {
      setResultModal((prev) => ({ ...prev, submitting: true }));
      await InterviewAPI.submitResult(resultModal.interview.id, {
        result: resultModal.form.result,
        notes: resultModal.form.notes,
        no_show: false,
      });
      toast.success("Đã gửi kết quả phỏng vấn");
      setResultModal(INITIAL_RESULT_MODAL);
      await fetchDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể gửi kết quả phỏng vấn.");
      setResultModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // --- STATUS BADGE ---
  const { icon: StatusIcon, label: statusLabel, color: statusColor } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* LEFT */}
            <div className="flex items-start sm:items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-slate-900">{candidate?.full_name}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">#{app.id}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>Ứng tuyển: {dayjs(applied_at).format("DD/MM/YYYY")}</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusLabel}
              </span>

              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  size="sm" variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={actionLoading}
                  onClick={handleChatCandidate}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Chat ứng viên
                </Button>

                {isPendingApplication && (
                  <>
                    <Button
                      size="sm" variant="outline"
                      className="!border-red-600 !bg-red-600 !text-white hover:!border-red-700 hover:!bg-red-700 focus:!ring-red-300"
                      disabled={actionLoading}
                      onClick={handleReject}
                    >
                      Từ chối
                    </Button>
                    <Button
                      size="sm" variant="primary"
                      className="shadow-md shadow-blue-500/20"
                      onClick={() => setInterviewModal({ open: true, mode: "create", interview: null })}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Hẹn phỏng vấn
                    </Button>
                  </>
                )}

                {canViewOffer && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="shadow-md shadow-blue-500/20 disabled:hover:brightness-100"
                    disabled={actionLoading || viewOfferLoading}
                    onClick={handleViewOffer}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    {viewOfferLoading ? "Loading..." : "View Offer"}
                  </Button>
                )}

                {canSendOffer && (
                  <Button
                    size="sm"
                    variant="green"
                    disabled={actionLoading}
                    onClick={() => setOfferModalOpen(true)}
                  >
                    Send Offer
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* INTERVIEW TIMELINE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Lịch trình phỏng vấn
                </h3>
                {(isPendingApplication || status === "interviewing") && !hasActiveInterview && (
                  <Button
                    size="sm" variant="primary"
                    onClick={() => setInterviewModal({ open: true, mode: "create", interview: null })}
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
                      const stConfig = INTERVIEW_STATUS_CONFIG[itv.status] ?? INTERVIEW_STATUS_CONFIG.scheduled;
                      const resultConfig = INTERVIEW_RESULT_CONFIG[itv.result] ?? INTERVIEW_RESULT_CONFIG.pending;
                      const canManage = itv.status !== "cancelled" && itv.status !== "completed" && status === "interviewing";
                      const canSubmitResult = ["scheduled", "rescheduled"].includes(itv.status);
                      const sanitizedNotes = typeof itv.notes === "string" ? DOMPurify.sanitize(itv.notes) : "";
                      const showNotes = hasMeaningfulHtmlContent(sanitizedNotes);

                      return (
                        <div key={itv.id} className="relative flex items-start group">
                          <div className={`absolute left-0 top-0 mt-1 ml-[11px] h-4 w-4 rounded-full border-2 bg-white z-10 ${stConfig.ring}`} />

                          <div className="ml-12 w-full">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group-hover:border-blue-200">
                              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                <div>
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    {itv.mode === "online"
                                      ? <><Video className="w-4 h-4 text-purple-500" /> Phỏng vấn Online</>
                                      : <><User className="w-4 h-4 text-orange-500" /> Phỏng vấn Trực tiếp</>
                                    }
                                  </h4>
                                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {dayjs(itv.scheduled_at).format("DD/MM/YYYY")}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    {dayjs(itv.scheduled_at).format("HH:mm")}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${stConfig.color}`}>
                                    {stConfig.label}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${resultConfig.color}`}>
                                    {resultConfig.label}
                                  </span>
                                </div>
                              </div>

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
                                {showNotes && (
                                  <div className="flex gap-2 text-slate-600 italic">
                                    <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div
                                      className="prose prose-slate prose-sm max-w-none text-slate-600 break-words prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-slate-800 [&_*]:max-w-full [&_ul]:pl-5 [&_ol]:pl-5"
                                      dangerouslySetInnerHTML={{ __html: sanitizedNotes }}
                                    />
                                  </div>
                                )}
                              </div>

                              {(canManage || canSubmitResult) && (
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                  {canSubmitResult && (
                                    <button
                                      type="button"
                                      onClick={() => setResultModal({ ...INITIAL_RESULT_MODAL, open: true, interview: itv })}
                                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1"
                                    >
                                      Gửi kết quả
                                    </button>
                                  )}
                                  {canManage && (
                                    <>
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
                                    </>
                                  )}
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

            {/* CV & DOCUMENTS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  CV & Hồ sơ đính kèm
                </h3>
              </div>
              <div className="p-6">
                {!cv ? (
                  <p className="text-slate-500 text-sm italic">Ứng viên chưa tải lên CV.</p>
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
                          <Button size="xs" variant="white" onClick={() => window.open(cv.file_url, "_blank")} title="Xem trước">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button size="xs" variant="white" onClick={() => handleDownloadFileCv(cv)} title="Tải xuống">
                            <Download className="w-4 h-4 text-slate-600" />
                          </Button>
                        </>
                      ) : (
                        <Button size="xs" variant="primary" onClick={() => MySwal.fire({ title: "Thông báo", text: "Chức năng xem CV Online đang phát triển.", icon: "info" })}>
                          Xem Online
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COVER LETTER */}
            {shouldShowCoverLetter && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Cover Letter
                  </h3>
                </div>
                <div className="p-6">
                  <div
                    className="prose prose-slate prose-sm max-w-none rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-slate-700 prose-p:my-3 prose-p:leading-7 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-slate-900 prose-a:text-blue-600 break-words [&_*]:max-w-full [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizedCoverLetter }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* CANDIDATE CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <div className="px-6 pb-6 text-center -mt-10">
                <img
                  src={candidate?.avatar_url || `https://ui-avatars.com/api/?name=${candidate?.full_name}`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md mx-auto object-cover bg-white"
                />
                <h2 className="mt-3 text-lg font-bold text-slate-900">{candidate?.full_name}</h2>
                <p className="text-slate-500 text-sm">{candidate?.email}</p>

                <div className="mt-6 flex flex-col gap-3">
                  {[
                    { href: `mailto:${candidate?.email}`, icon: Mail, label: "Email",  value: candidate?.email },
                    { href: `tel:${candidate?.phone}`,    icon: Phone, label: "Phone", value: candidate?.phone },
                  ].map(({ href, icon: Icon, label, value }) => (
                    <a key={label} href={href} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* JOB INFO */}
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

      {/* MODALS */}
      <InterviewFormModal
        open={interviewModal.open}
        mode={interviewModal.mode}
        interview={interviewModal.mode === "edit" ? interviewModal.interview : null}
        applicationId={id}
        onClose={(saved) => {
          setInterviewModal({ open: false, mode: "create", interview: null });
          if (saved) fetchDetail();
        }}
      />

      <JobOfferFormModal
        open={offerModalOpen}
        applicationId={id}
        onClose={(saved) => {
          setOfferModalOpen(false);
          if (saved) fetchDetail();
        }}
      />

      <Modal
        open={viewOfferModal.open}
        onClose={() => setViewOfferModal({ open: false, offer: null })}
        title="View Offer"
        width="max-w-3xl mx-4"
      >
        {currentOffer && (
          <div className="max-h-[78vh] overflow-y-auto pr-1">
            <div className="space-y-6 text-[15px] text-slate-700 font-normal">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Offer title</p>
                    <h3 className="mt-1 break-words text-2xl font-bold text-slate-900">
                      {currentOffer.title || "--"}
                    </h3>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    {formatOfferTextValue(currentOffer.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {offerInfoItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">Offer message</p>
                {hasOfferMessage ? (
                  <div
                    className="prose prose-slate prose-sm max-w-none rounded-xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm prose-p:my-3 prose-p:leading-7 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-slate-900 prose-a:text-blue-600 break-words [&_*]:max-w-full [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizedOfferMessage }}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No message available.
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button variant="outline" onClick={() => setViewOfferModal({ open: false, offer: null })}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={resultModal.open}
        onClose={() => { if (!resultModal.submitting) setResultModal(INITIAL_RESULT_MODAL); }}
        title="Gửi kết quả phỏng vấn"
        width="max-w-2xl"
        closeOnOverlay={!resultModal.submitting}
      >
        <div className="space-y-6 text-[15px] text-slate-700 font-normal">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Kết quả phỏng vấn</p>
            <div className="flex flex-wrap gap-6">
              {INTERVIEW_RESULT_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interviewResult"
                    value={option.value}
                    checked={resultModal.form.result === option.value}
                    onChange={() => setResultModal((prev) => ({ ...prev, form: { ...prev.form, result: option.value } }))}
                    className="accent-blue-600 h-4 w-4"
                    disabled={resultModal.submitting}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Ghi chú</label>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <JoditEditor
                ref={resultNotesEditorRef}
                value={resultModal.form.notes}
                config={RESULT_NOTES_EDITOR_CONFIG}
                onBlur={(newContent) => setResultModal((prev) => ({ ...prev, form: { ...prev.form, notes: newContent } }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setResultModal(INITIAL_RESULT_MODAL)} disabled={resultModal.submitting}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmitInterviewResult} disabled={resultModal.submitting}>
              {resultModal.submitting ? "Đang gửi..." : "Gửi kết quả"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
