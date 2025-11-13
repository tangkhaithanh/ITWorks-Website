import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Button from "@/components/ui/Button";
import useInterviewSchedules from "../useInterviewSchedules";
import InterviewAPI from "../InterviewAPI";
import toast from "react-hot-toast";

const statusMap = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-rose-100 text-rose-700" },
  proposed: { label: "Đề xuất mới", color: "bg-blue-100 text-blue-700" },
};

const getStatusDisplay = (status) => {
  if (!status) {
    return { label: "Không rõ", color: "bg-slate-100 text-slate-600" };
  }
  const normalized = String(status).toLowerCase();
  return (
    statusMap[normalized] || {
      label: status,
      color: "bg-slate-100 text-slate-600",
    }
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format("DD/MM/YYYY HH:mm");
};

const toInputDateTimeValue = (value) => {
  if (!value) return "";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "";
  return parsed.format("YYYY-MM-DDTHH:mm");
};

const CandidateInterviewsPage = () => {
  const { schedules, loading, refetch } = useInterviewSchedules({ scope: "candidate" });
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [form, setForm] = useState({ datetime: "", mode: "online", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const openModal = (schedule) => {
    setCurrentSchedule(schedule);
    setForm({
      datetime: toInputDateTimeValue(schedule?.scheduled_at),
      mode: schedule?.mode || "online",
      note: schedule?.note || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentSchedule(null);
    setSubmitting(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (schedule) => {
    try {
      await InterviewAPI.confirm(schedule.id);
      toast.success("Đã xác nhận lịch phỏng vấn");
      refetch();
    } catch (error) {
      const message = error?.response?.data?.message || "Không thể xác nhận lịch";
      toast.error(message);
    }
  };

  const handleSubmitReschedule = async (event) => {
    event.preventDefault();
    if (!currentSchedule) return;

    try {
      setSubmitting(true);
      await InterviewAPI.update(currentSchedule.id, {
        scheduled_at: form.datetime,
        mode: form.mode,
        note: form.note,
      });
      toast.success("Đã gửi đề xuất lịch phỏng vấn mới");
      closeModal();
      refetch();
    } catch (error) {
      const message = error?.response?.data?.message || "Không thể đề xuất lại lịch";
      toast.error(message);
      setSubmitting(false);
    }
  };

  const emptyMessage = useMemo(() => {
    if (loading) return "Đang tải lịch phỏng vấn...";
    if (!schedules?.length) return "Chưa có lịch phỏng vấn nào";
    return null;
  }, [loading, schedules]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Lịch phỏng vấn của tôi</h1>
        <p className="text-sm text-slate-600">
          Theo dõi và quản lý các lịch phỏng vấn bạn nhận được từ nhà tuyển dụng.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left text-sm font-semibold text-slate-700">
                <th className="rounded-l-lg p-3">Công việc</th>
                <th className="p-3">Công ty</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Hình thức</th>
                <th className="p-3">Ghi chú</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="rounded-r-lg p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {emptyMessage ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => {
                  const statusDisplay = getStatusDisplay(schedule.status);

                  return (
                    <tr
                      key={schedule.id}
                      className="border-b border-slate-100 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="p-3 font-medium text-slate-800">
                        {schedule.job?.title || schedule.application?.job?.title || "—"}
                      </td>
                      <td className="p-3">
                        {schedule.company?.name || schedule.application?.job?.company?.name || "—"}
                      </td>
                      <td className="p-3">{formatDateTime(schedule.scheduled_at)}</td>
                      <td className="p-3 capitalize">{schedule.mode || "—"}</td>
                      <td className="p-3">
                        {schedule.note ? (
                          <span className="block max-w-xs truncate" title={schedule.note}>
                            {schedule.note}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusDisplay.color}`}
                        >
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="green"
                            onClick={() => handleConfirm(schedule)}
                            disabled={schedule.status === "confirmed"}
                          >
                            Xác nhận
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openModal(schedule)}>
                            Đề xuất lại
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800">Đề xuất lịch phỏng vấn mới</h3>
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600"
                onClick={closeModal}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReschedule} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Thời gian mong muốn
                </label>
                <input
                  type="datetime-local"
                  name="datetime"
                  value={form.datetime}
                  onChange={handleChange}
                  required
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức</label>
                <select
                  name="mode"
                  value={form.mode}
                  onChange={handleChange}
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="call">Gọi điện</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ghi chú bổ sung
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Lý do đề xuất lại, thông tin bổ sung..."
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} disabled={submitting}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi đề xuất"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewsPage;
