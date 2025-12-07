import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import Button from "@/components/ui/Button";
import CandidateAPI from "../CandidateAPI";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const genderOptions = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export default function EditPersonalInfoModal({
  open,
  onClose,
  profile,
  onUpdated,
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    dob: null,
    gender: "",
    address: "",
  });

  const [saving, setSaving] = useState(false);

  // Fill dữ liệu khi mở modal
  useEffect(() => {
    if (!open || !profile) return;

    setForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      dob: profile.dob ? new Date(profile.dob) : null,
      gender: profile.gender || "",
      address: profile.address || "",
    });
  }, [open, profile]);

  // handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "dob") return;
        if (value !== null && value !== "" && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (form.dob) {
        formData.append("dob", new Date(form.dob).toISOString());
      }

      await CandidateAPI.updateUser(formData);

      Swal.fire({
        icon: "success",
        title: "Đã cập nhật!",
        text: "Thông tin cá nhân đã được lưu.",
        timer: 1500,
        showConfirmButton: false,
      });

      onUpdated?.();
      onClose?.();

    } catch (error) {
      console.error("Lỗi cập nhật user:", error);

      Swal.fire({
        icon: "error",
        title: "Cập nhật thất bại",
        text: "Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Chỉnh sửa thông tin cá nhân"
      width="max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        encType="multipart/form-data"
      >
        {/* 🔥 Chỉ còn FORM — không còn avatar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <TextInput
            label="Họ và tên"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <TextInput
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

                <DatePickerInput
          label="Ngày sinh"
          name="dob"
          value={form.dob}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              dob: e.target.value, // string "YYYY-MM-DD"
            }))
          }
        />

          <SelectInput
            label="Giới tính"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={genderOptions}
            placeholder="Chọn giới tính"
          />

          <div className="md:col-span-2">
            <TextInput
              label="Địa chỉ"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
