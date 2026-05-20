import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ReportAdminAPI from "@/features/admin/ReportAdminAPI";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  under_review: "Đang xem xét",
  resolved: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("under_review");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await ReportAdminAPI.getDetail(id);
      const data = res.data.data ?? res.data;
      setReport(data);
      setStatus(data.status === "pending" ? "under_review" : data.status);
    } catch (err) {
      console.error("Cannot load report detail", err);
      toast.error("Không thể tải chi tiết báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      const res = await ReportAdminAPI.updateStatus(id, { status, note });
      setReport(res.data.data ?? res.data);
      setNote("");
      toast.success("Đã cập nhật trạng thái báo cáo");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật báo cáo");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseJob = async () => {
    try {
      setSaving(true);
      const res = await ReportAdminAPI.closeReportedJob(id, {
        note,
        resolveReport: true,
      });
      setReport(res.data.data ?? res.data);
      setNote("");
      toast.success("Đã đóng tin tuyển dụng và xử lý báo cáo");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không thể đóng tin tuyển dụng",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải chi tiết báo cáo...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-10 text-center text-rose-600">
        Không tìm thấy báo cáo
      </div>
    );
  }

  const isJobReport = report.targetType === "job";
  const isFinalReportStatus = ["dismissed", "resolved"].includes(
    report.status,
  );
  const canCloseReportedJob =
    isJobReport &&
    !isFinalReportStatus &&
    report.target?.status !== "closed";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/admin/reports")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách báo cáo
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {isJobReport ? (
                <Briefcase className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {isJobReport ? "Tin tuyển dụng" : "Công ty"}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {report.targetTitle || "Không rõ đối tượng"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Người báo cáo: {report.reporterName || report.reporterAccountId}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {STATUS_LABELS[report.status] || report.status}
          </span>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Lý do báo cáo
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-800">
            {report.reason}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Lịch sử xử lý</h2>
          <div className="mt-4 space-y-3">
            {report.history?.length ? (
              report.history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">
                      {STATUS_LABELS[item.fromStatus] ||
                        item.fromStatus ||
                        "Mới"}{" "}
                      → {STATUS_LABELS[item.toStatus] || item.toStatus}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {item.note && (
                    <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Chưa có lịch sử xử lý.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Thao tác</h2>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={isFinalReportStatus}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Ghi chú nội bộ
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              maxLength={1000}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={saving || isFinalReportStatus}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            Cập nhật trạng thái
          </button>

          {isJobReport && (
            <button
              type="button"
              onClick={handleCloseJob}
              disabled={saving || !canCloseReportedJob}
              className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-300"
            >
              Đóng tin tuyển dụng nghi vấn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
