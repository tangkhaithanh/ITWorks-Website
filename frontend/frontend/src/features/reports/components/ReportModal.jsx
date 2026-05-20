import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import ReportAPI from "@/features/reports/ReportAPI";

const MIN_REASON_LENGTH = 10;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  "Không thể gửi báo cáo lúc này";

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length >= MIN_REASON_LENGTH && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error("Vui lòng nhập lý do báo cáo ít nhất 10 ký tự");
      return;
    }

    try {
      setSubmitting(true);
      await ReportAPI.create({
        targetType,
        targetId: String(targetId),
        reason: trimmedReason,
      });
      toast.success("Đã gửi báo cáo đến quản trị viên");
      onClose?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Báo cáo nội dung
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {targetTitle || "Nội dung này"} sẽ được gửi tới quản trị viên.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Lý do báo cáo
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              maxLength={1000}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Mô tả dấu hiệu gian lận, thông tin sai lệch hoặc lý do bạn muốn báo cáo..."
            />
          </label>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tối thiểu 10 ký tự</span>
            <span>{trimmedReason.length}/1000</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
