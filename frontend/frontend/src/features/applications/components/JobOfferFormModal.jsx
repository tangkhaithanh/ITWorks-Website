import { useEffect, useRef, useState } from "react";
import JoditEditor from "jodit-react";
import Swal from "sweetalert2";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import JobOfferAPI from "@/features/applications/JobOfferAPI";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  title: "",
  message: "",
  salaryOption: "negotiable",
  salary: "",
  currency: "VND",
  employment_type: "",
  expiresDate: "",
  expiresTime: "",
};

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "fulltime", label: "Toàn thời gian" },
  { value: "parttime", label: "Bán thời gian" },
  { value: "intern", label: "Thực tập sinh" },
  { value: "contract", label: "Theo hợp đồng" },
];

const CURRENCY_OPTIONS = [
  { value: "VND", label: "VND" },
  { value: "USD", label: "USD" },
];

const OFFER_MESSAGE_EDITOR_CONFIG = {
  readonly: false,
  height: 280,
  placeholder: "Nhập nội dung offer...",
  toolbarAdaptive: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  allowPaste: true,
  buttons: [
    "bold", "italic", "underline", "strikethrough", "|",
    "ul", "ol", "|", "link", "|", "align", "|",
    "undo", "redo", "|", "hr", "eraser",
  ],
};

const formatSalary = (value) =>
  String(value || "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const getDigits = (value) => String(value || "").replace(/\D/g, "");

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hasTextContent = (html = "") => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Boolean(doc.body.textContent?.replace(/\u00a0/g, " ").trim());
};

export default function JobOfferFormModal({ open, applicationId, onClose }) {
  const editorRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setSubmitting(false);
    }
  }, [open]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleDateChange = (e) => {
    const nextDate = e.target.value;
    const today = toLocalDateString(new Date());

    updateForm({
      expiresDate: nextDate,
      expiresTime: nextDate === today ? "" : form.expiresTime,
    });
  };

  const handleTimeChange = (e) => {
    const nextTime = e.target.value;

    if (!form.expiresDate) {
      Swal.fire("Chưa chọn ngày", "Bạn phải chọn ngày trước khi chọn giờ.", "warning");
      return;
    }

    const selected = new Date(`${form.expiresDate}T${nextTime}`);
    if (selected <= new Date()) {
      Swal.fire("Không hợp lệ", "Thời hạn offer phải lớn hơn thời điểm hiện tại.", "warning");
      return;
    }

    updateForm({ expiresTime: nextTime });
  };

  const validate = () => {
    if (!form.title.trim()) {
      Swal.fire("Thiếu thông tin", "Bạn phải nhập tiêu đề offer.", "warning");
      return false;
    }

    if (!hasTextContent(form.message)) {
      Swal.fire("Thiếu thông tin", "Bạn phải nhập nội dung offer.", "warning");
      return false;
    }

    if (form.salaryOption === "salary" && !form.salary) {
      Swal.fire("Thiếu thông tin", "Bạn phải nhập mức lương hoặc chọn thỏa thuận.", "warning");
      return false;
    }

    if (!form.employment_type) {
      Swal.fire("Thiếu thông tin", "Bạn phải chọn loại hình làm việc.", "warning");
      return false;
    }

    if (!form.expiresDate || !form.expiresTime) {
      Swal.fire("Thiếu thông tin", "Bạn phải chọn đầy đủ ngày và giờ hết hạn offer.", "warning");
      return false;
    }

    if (new Date(`${form.expiresDate}T${form.expiresTime}`) <= new Date()) {
      Swal.fire("Không hợp lệ", "Thời hạn offer phải lớn hơn thời điểm hiện tại.", "warning");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const expiresAt = new Date(`${form.expiresDate}T${form.expiresTime}`);
    const isNegotiable = form.salaryOption === "negotiable";
    const payload = {
      application_id: Number(applicationId),
      title: form.title.trim(),
      message: form.message,
      salary: isNegotiable ? null : Number(form.salary),
      currency: isNegotiable ? null : form.currency,
      employment_type: form.employment_type,
      expires_at: expiresAt.toISOString(),
    };

    try {
      setSubmitting(true);
      await JobOfferAPI.create(payload);
      toast.success("Đã gửi offer cho ứng viên");
      onClose(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể gửi offer.");
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose(false)}
      title="Gửi offer"
      width="max-w-4xl mx-4"
      closeOnOverlay={!submitting}
    >
      <div className="max-h-[78vh] overflow-y-auto pr-1">
        <div className="space-y-6 text-[15px] text-slate-700 font-normal">
          <TextInput
            label="Tiêu đề"
            name="title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="VD: Thư mời nhận việc"
            required
            disabled={submitting}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Nội dung offer <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400">
              <JoditEditor
                ref={editorRef}
                value={form.message}
                config={OFFER_MESSAGE_EDITOR_CONFIG}
                onBlur={(newContent) => updateForm({ message: newContent })}
                onChange={(newContent) => updateForm({ message: newContent })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm font-medium text-slate-800">Mức lương</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="salaryOption"
                  value="salary"
                  checked={form.salaryOption === "salary"}
                  onChange={() => updateForm({ salaryOption: "salary" })}
                  className="accent-blue-600 h-4 w-4"
                  disabled={submitting}
                />
                <span>Nhập mức lương</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="salaryOption"
                  value="negotiable"
                  checked={form.salaryOption === "negotiable"}
                  onChange={() => updateForm({ salaryOption: "negotiable", salary: "", currency: "VND" })}
                  className="accent-blue-600 h-4 w-4"
                  disabled={submitting}
                />
                <span>Thỏa thuận</span>
              </label>
            </div>

            {form.salaryOption === "salary" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_160px] animate-in fade-in slide-in-from-top-2 duration-200">
                <TextInput
                  label="Lương"
                  name="salary"
                  type="text"
                  inputMode="numeric"
                  value={formatSalary(form.salary)}
                  onChange={(e) => updateForm({ salary: getDigits(e.target.value) })}
                  placeholder="500.000"
                  required
                  disabled={submitting}
                />
                <SelectInput
                  label="Tiền tệ"
                  name="currency"
                  value={form.currency}
                  onChange={(e) => updateForm({ currency: e.target.value })}
                  options={CURRENCY_OPTIONS}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectInput
              label="Loại hình làm việc"
              name="employment_type"
              value={form.employment_type}
              onChange={(e) => updateForm({ employment_type: e.target.value })}
              options={EMPLOYMENT_TYPE_OPTIONS}
              placeholder="-- Chọn loại hình --"
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePickerInput
                label="Ngày hết hạn"
                name="expiresDate"
                value={form.expiresDate}
                onChange={handleDateChange}
                required
                minDate={new Date()}
              />
              <TextInput
                type="time"
                label="Giờ"
                name="expiresTime"
                value={form.expiresTime}
                onChange={handleTimeChange}
                required
                disabled={!form.expiresDate || submitting}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 border-t border-slate-200 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onClose(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi offer"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
