// src/features/applications/pages/ApplicationDetailsPage.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import InterviewAPI from "../InterviewAPI";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import Button from "@/components/ui/Button";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import InterviewFormModal from "@/features/applications/components/InterviewFormModal";
const MySwal = withReactContent(Swal);

export default function ApplicationDetailsPage() {
  const { id } = useParams();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  

  // Modal state: create / edit + interview đang chọn
  const [interviewModal, setInterviewModal] = useState({
    open: false,
    mode: "create", // "create" | "edit"
    interview: null,
  });

  // ==========================
  // FETCH DETAIL
  // ==========================
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { candidate, job, cv, interviews = [], status, applied_at } = app || {};
  const hasActiveInterview = interviews.some(
  itv => itv.status === "scheduled" || itv.status === "rescheduled"
);

  // ==========================
  // ACTION HANDLERS
  // ==========================
  const handleAccept = async () => {
    const confirm = await MySwal.fire({
      title: "Chấp nhận ứng viên?",
      text: "Ứng viên sẽ được nhận làm nhân viên chính thức, bạn có chắc chưa?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Chấp nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#16a34a",
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await ApplicationAPI.accept(id);
      await MySwal.fire(
        "Thành công!",
        "Ứng viên đã được nhận làm nhân viên chính thức.",
        "success"
      );
      fetchDetail();
    } catch (err) {
      console.error(err);
      MySwal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể cập nhật trạng thái.",
        "error"
      );
    }
  };

  const handleReject = async () => {
    const confirm = await MySwal.fire({
      title: "Từ chối ứng viên?",
      text: "Ứng viên sẽ không được nhận làm nhân viên, bạn có chắc chưa?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await ApplicationAPI.reject(id);
      await MySwal.fire("Thành công!", "Đã từ chối ứng viên.", "success");
      fetchDetail();
    } catch (err) {
      console.error(err);
      MySwal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể cập nhật trạng thái.",
        "error"
      );
    }
  };


  const handleDownloadFileCv = async (cv) => {
  if (!cv?.file_url) return;

  const response = await fetch(cv.file_url, {
    mode: "cors",
  });
  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = cv.title || "cv.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.URL.revokeObjectURL(url);
};
const handleViewFileCv = (cv) => {
  if (!cv?.file_url) return;

  window.open(cv.file_url, "_blank");   // Mở tab mới để xem PDF
};


  const handleViewOnlineCv = () =>
    MySwal.fire({
      title: "CV online",
      text: "Bạn có thể bổ sung route preview cho CV online sau.",
      icon: "info",
    });

  // ==========================
  // HỦY LỊCH PHỎNG VẤN (theo từng interview)
  // ==========================
  const handleCancelInterview = async (interview) => {
    if (!interview) return;

    const confirm = await MySwal.fire({
      title: "Hủy lịch phỏng vấn?",
      text: "Trạng thái đơn ứng tuyển sẽ quay về PENDING.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hủy lịch",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await InterviewAPI.cancel(interview.id);

      await MySwal.fire("Đã hủy lịch", "Lịch phỏng vấn đã được hủy.", "success");

      fetchDetail();
    } catch (err) {
      console.error(err);
      MySwal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể hủy lịch phỏng vấn.",
        "error"
      );
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-600 font-medium">Không tìm thấy dữ liệu đơn ứng tuyển.</p>
        </div>
      </div>
    );
  }

  // ==========================
  // STATUS UTILS
  // ==========================
  const statusLabelMap = {
    pending: "Đang chờ xử lý",
    interviewing: "Đang phỏng vấn",
    accepted: "Đã chấp nhận",
    rejected: "Đã từ chối",
    withdrawn: "Ứng viên đã rút đơn",
  };

  const statusClassMap = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    interviewing: "bg-blue-50 text-blue-700 border border-blue-200",
    accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    withdrawn: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  const statusLabel = statusLabelMap[status];
  const statusClass = statusClassMap[status];

  // Interview status mapping
  const interviewStatusLabelMap = {
    scheduled: "Đã lên lịch",
    rescheduled: "Đã dời lịch",
    cancelled: "Đã hủy",
    completed: "Đã hoàn thành",
  };

  const interviewStatusClassMap = {
    scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
    rescheduled: "bg-amber-50 text-amber-700 border border-amber-200",
    cancelled: "bg-slate-100 text-slate-600 border border-slate-300",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  const getInterviewStatusLabel = (st) =>
    interviewStatusLabelMap[st] || st || "—";

  const getInterviewStatusClass = (st) =>
    interviewStatusClassMap[st] || "bg-slate-50 text-slate-700 border border-slate-200";

  const getInterviewDotClass = (st) => {
    if (st === "cancelled") return "border-slate-400 bg-slate-100";
    if (st === "completed") return "border-emerald-500 bg-emerald-100";
    if (st === "rescheduled") return "border-amber-500 bg-amber-100";
    return "border-blue-500 bg-blue-100"; // scheduled
  };

  // Thêm vào đầu component hoặc utils
const getInterviewStatusClassPremium = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "cancelled":
      return "bg-slate-100 text-slate-600 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
};


  // ==========================
  // RENDER ACTIONS TRÊN TOP BAR
  // ==========================
  const renderTopActions = () => {
    if (status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              setInterviewModal({ open: true, mode: "create", interview: null })
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Hẹn phỏng vấn
          </Button>

          <Button size="sm" variant="outline" onClick={handleReject}>
            Từ chối
          </Button>
        </div>
      );
    }

    if (status === "interviewing") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="green" onClick={handleAccept}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Chấp nhận
          </Button>

          <Button size="sm" variant="outline" onClick={handleReject}>
            Từ chối
          </Button>
        </div>
      );
    }

    return null; // accepted / rejected / withdrawn
  };

  // ==========================
  // MAIN UI
  // ==========================
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-5">
      {/* TOP BAR */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Chi tiết đơn ứng tuyển
          </h1>
          <p className="text-sm text-slate-500">
            Mã đơn: <span className="font-mono font-medium text-slate-700">#{app.id}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${statusClass}`}
          >
            {statusLabel}
          </span>

          {renderTopActions()}
        </div>
      </div>

      {/* CANDIDATE INFO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-start gap-5">
          <div className="relative">
            <img
              src={candidate?.avatar_url || "https://i.pravatar.cc/150?img=3"}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-bold text-slate-800">{candidate?.full_name}</h2>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{candidate?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">{candidate?.phone}</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                Ứng tuyển lúc:{" "}
                <span className="font-semibold text-slate-700">
                  {applied_at
                    ? dayjs(applied_at).format("DD/MM/YYYY HH:mm")
                    : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* JOB INFO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Thông tin công việc
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Tiêu đề công việc</p>
            <p className="font-semibold text-slate-800 text-base">{job?.title}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Cấp độ</p>
            <p className="text-slate-700">
              {Array.isArray(job?.experience_levels)
                ? job.experience_levels.join(", ")
                : "—"}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Hình thức</p>
            <p className="text-slate-700">
              {Array.isArray(job?.work_modes)
                ? job.work_modes.join(", ")
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* CV & DOCUMENTS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CV & Tài liệu
        </h3>

        {!cv && (
          <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ứng viên chưa đính kèm CV.
          </div>
        )}

        {cv && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-800">{cv.title}</p>
            </div>

            {cv.type === "file" && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleViewFileCv(cv)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Xem CV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadFileCv(cv)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </Button>
              </div>
            )}

            {cv.type === "online" && (
              <Button size="sm" variant="primary" onClick={handleViewOnlineCv}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Xem CV online
              </Button>
            )}
          </div>
        )}
      </div>

      {/* INTERVIEW SECTION - VERTICAL TIMELINE */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Lịch phỏng vấn
          </h3>

          {/* Nút tạo lịch mới (tuỳ theo trạng thái đơn) */}
          {(status === "pending" || status === "interviewing") && !hasActiveInterview && (
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setInterviewModal({ open: true, mode: "create", interview: null })
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm lịch
            </Button>
          )}
        </div>

        {interviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Chưa có lịch phỏng vấn cho ứng viên này.
            </p>
          </div>
        )}

    {interviews.length > 0 && (
  <div className="relative border-l-2 border-slate-200 ml-4 mt-2">
    {interviews.map((itv) => (
      <div
        key={itv.id}
        className="relative pl-8 pb-6 last:pb-0"
      >
        {/* Timeline Dot - aligned better */}
        <span
          className={`absolute -left-[9px] top-4 w-3.5 h-3.5 rounded-full border-2 ${getInterviewDotClass(
            itv.status
          )}`}
        ></span>

        {/* Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/70 hover:border-slate-300 transition-all duration-200 hover:shadow-sm">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b border-slate-200">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {itv.mode === "online" ? "Phỏng vấn Online" : "Phỏng vấn Trực tiếp"}
              </h4>

              {/* Time */}
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold">
                  {dayjs(itv.scheduled_at).format("DD/MM/YYYY")}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-sm font-semibold">
                  {dayjs(itv.scheduled_at).format("HH:mm")}
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${getInterviewStatusClassPremium(
                itv.status
              )}`}
            >
              {getInterviewStatusLabel(itv.status)}
            </span>
          </div>

          {/* Body */}
          <div className="space-y-3 mb-3">

            {/* Online meeting link */}
            {itv.mode === "online" && itv.meeting_link && (
              <div className="flex items-start gap-2.5 p-3 bg-blue-50/40 rounded-lg border border-blue-200/60">
                <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-blue-900 uppercase tracking-wide mb-1">
                    Link phỏng vấn
                  </p>
                  <a
                    href={itv.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium break-all leading-relaxed"
                  >
                    {itv.meeting_link}
                  </a>
                </div>
              </div>
            )}

            {/* Offline location */}
            {itv.mode === "offline" && itv.location && (
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <svg className="w-4 h-4 text-slate-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Địa điểm
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{itv.location}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {itv.notes && (
              <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide mb-1">
                    Ghi chú
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {itv.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {itv.status !== "cancelled" &&
            itv.status !== "completed" &&
            status === "interviewing" && (
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setInterviewModal({
                      open: true,
                      mode: "edit",
                      interview: itv,
                    })
                  }
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelInterview(itv)}
                  disabled={actionLoading}
                  className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 shadow-sm hover:shadow transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hủy lịch
                </Button>
              </div>
            )}
        </div>
      </div>
    ))}
  </div>
)}
    </div>

      {/* INTERVIEW MODAL */}
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
