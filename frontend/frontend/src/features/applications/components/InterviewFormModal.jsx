import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import InterviewAPI from "../InterviewAPI";

const MySwal = withReactContent(Swal);

export default function InterviewFormModal({
  open,
  mode,
  onClose,
  applicationId,
  interview,
}) {
  const isEdit = mode === "edit";

  // FORM STATE
  const [form, setForm] = useState({
    date: "",
    time: "",
    mode: "",
    location: "",
    meeting_link: "",
    notes: "",
  });

  // PREFILL WHEN EDIT
  useEffect(() => {
    if (isEdit && interview?.scheduled_at) {
      const dt = new Date(interview.scheduled_at);

      setForm({
        date: dt.toISOString().slice(0, 10), // yyyy-mm-dd
        time: dt.toTimeString().slice(0, 5), // HH:mm
        mode: interview.mode || "",
        location: interview.location || "",
        meeting_link: interview.meeting_link || "",
        notes: interview.notes || "",
      });
    } else {
      setForm({
        date: "",
        time: "",
        mode: "",
        location: "",
        meeting_link: "",
        notes: "",
      });
    }
  }, [open]);

  // SUBMIT
  const handleSubmit = async () => {
    if (!form.date || !form.time) {
      return MySwal.fire("Thiếu thông tin", "Bạn phải chọn ngày và giờ phỏng vấn", "warning");
    }

    if (!form.mode) {
      return MySwal.fire("Thiếu thông tin", "Bạn phải chọn hình thức phỏng vấn", "warning");
    }

    if (form.mode === "online" && !form.meeting_link.trim()) {
      return MySwal.fire("Thiếu link họp", "Online phải có link Google Meet/Zoom", "warning");
    }

    if (form.mode === "offline" && !form.location.trim()) {
      return MySwal.fire("Thiếu địa điểm", "Offline phải có địa điểm phỏng vấn", "warning");
    }

    // Combine DATE + TIME → scheduled_at
    const scheduled_at = new Date(`${form.date}T${form.time}`);

    const payload = {
      application_id: applicationId,
      scheduled_at: scheduled_at.toISOString(),
      mode: form.mode,
      location: form.mode === "offline" ? form.location : null,
      meeting_link: form.mode === "online" ? form.meeting_link : null,
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await InterviewAPI.update(interview.id, payload);
        await MySwal.fire("Thành công!", "Đã cập nhật lịch phỏng vấn.", "success");
      } else {
        await InterviewAPI.create(payload);
        await MySwal.fire("Thành công!", "Đã tạo lịch phỏng vấn.", "success");
      }

      onClose(true);
    } catch (err) {
      console.error("Interview error:", err);
      MySwal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể lưu lịch phỏng vấn.",
        "error"
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      title={isEdit ? "Chỉnh sửa lịch phỏng vấn" : "Tạo lịch phỏng vấn"}
      width="max-w-xl"
    >
      <div className="space-y-6 text-[15px] text-slate-700 font-normal">

        {/* DATE + TIME */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Thời gian phỏng vấn</p>

          <div className="grid grid-cols-2 gap-4">
            <DatePickerInput
              label="Ngày"
              name="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              minDate={new Date()}
            />

           <TextInput
          type="time"
          label="Giờ"
          name="time"
          value={form.time}
          onChange={(e) => {
            const newTime = e.target.value;

            // ⛔ Nếu chưa chọn ngày → không cho chọn giờ
            if (!form.date) {
              MySwal.fire(
                "Chưa chọn ngày",
                "Bạn phải chọn ngày trước khi chọn giờ.",
                "warning"
              );
              return;
            }

            const now = new Date();
            const todayStr = now.toISOString().split("T")[0];

            // Nếu ngày = hôm nay → validate giờ
            if (form.date === todayStr) {
              const selected = new Date(`${form.date}T${newTime}`);
              if (selected <= now) {
                MySwal.fire(
                  "Không hợp lệ",
                  "Thời gian phỏng vấn phải lớn hơn thời điểm hiện tại.",
                  "warning"
                );
                return;
              }
            }

            // Hợp lệ → cập nhật
            setForm({ ...form, time: newTime });
          }}
          required
        />

          </div>
        </div>

        {/* MODE RADIO */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Hình thức phỏng vấn</p>

          <div className="flex gap-6 text-[15px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="online"
                checked={form.mode === "online"}
                onChange={() => setForm({ ...form, mode: "online" })}
                className="accent-blue-600 h-4 w-4"
              />
              <span>Online</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="offline"
                checked={form.mode === "offline"}
                onChange={() => setForm({ ...form, mode: "offline" })}
                className="accent-blue-600 h-4 w-4"
              />
              <span>Trực tiếp</span>
            </label>
          </div>
        </div>

        {/* CONDITIONAL INPUTS */}
        {form.mode === "online" && (
          <TextInput
            label="Link họp (Google Meet / Zoom)"
            value={form.meeting_link}
            onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
            placeholder="https://meet.google.com/..."
            required
          />
        )}

        {form.mode === "offline" && (
          <TextInput
            label="Địa điểm phỏng vấn"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Địa chỉ công ty"
            required
          />
        )}

        {/* NOTES */}
        <TextInput
          label="Ghi chú (tuỳ chọn)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onClose(false)}>
            Hủy
          </Button>

          <Button variant="primary" onClick={handleSubmit}>
            {isEdit ? "Cập nhật" : "Tạo lịch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
