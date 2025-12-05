import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import MultiSelect from "@/components/common/MultiSelect";
import Button from "@/components/ui/Button";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import Swal from "sweetalert2";
export default function EditCareerInfoModal({
  open,
  onClose,
  candidate,
  skillOptions = [],
  categoryOptions = [],
  onSuccess,
}) {
  const [form, setForm] = useState({
    preferred_city: "",
    preferred_work_mode: "",
    preferred_category: "",
    preferred_salary: "",
    skills: [],
  });

  // Fill khi sửa
  useEffect(() => {
    if (candidate) {
      setForm({
        preferred_city: candidate.preferred_city || "",
        preferred_work_mode: candidate.preferred_work_mode || "",
        preferred_category: candidate.preferred_category
          ? String(candidate.preferred_category)
          : "",
        preferred_salary: candidate.preferred_salary || "",
        skills: candidate.skills?.map((s) => String(s.skill_id)) || [],
      });
    } else {
      setForm({
        preferred_city: "",
        preferred_work_mode: "",
        preferred_category: "",
        preferred_salary: "",
        skills: [],
      });
    }
  }, [candidate, open]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
  try {
    const payload = {
      preferred_city: form.preferred_city || null,
      preferred_work_mode: form.preferred_work_mode || null,
      preferred_category: form.preferred_category
        ? Number(form.preferred_category)
        : null,
      preferred_salary: form.preferred_salary
        ? Number(form.preferred_salary)
        : null,
      skills: form.skills.map((id) => Number(id)),
    };

    console.log("Sending payload:", payload);

    if (!candidate) {
      await CandidateAPI.createCandidate(payload);

      Swal.fire({
        icon: "success",
        title: "Thêm hồ sơ thành công!",
        text: "Thông tin nghề nghiệp đã được tạo.",
        confirmButtonColor: "#2563eb",
      });

    } else {
      await CandidateAPI.updateCandidate(payload);

      Swal.fire({
        icon: "success",
        title: "Cập nhật thành công!",
        text: "Hồ sơ nghề nghiệp đã được cập nhật.",
        confirmButtonColor: "#2563eb",
      });
    }

    onSuccess?.();
    onClose?.();

  } catch (err) {
    console.error("Save candidate error", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Có lỗi xảy ra",
      text: "Không thể lưu hồ sơ ứng viên.",
      confirmButtonColor: "#ef4444",
    });
  }
};


  return (
    <Modal
      open={open}
      onClose={onClose}
      title={candidate ? "Cập nhật hồ sơ nghề nghiệp" : "Thêm thông tin nghề nghiệp"}
      width="max-w-2xl"
    >
      <div className="space-y-4">

        <TextInput
          label="Thành phố mong muốn"
          name="preferred_city"
          value={form.preferred_city}
          onChange={handleChange}
          placeholder="VD: Hà Nội, TP.HCM"
        />

        <SelectInput
          label="Hình thức làm việc"
          name="preferred_work_mode"
          value={form.preferred_work_mode}
          onChange={handleChange}
          options={[
            { value: "", label: "— Chọn —" },
            { value: "onsite", label: "Tại văn phòng" },
            { value: "remote", label: "Remote" },
            { value: "hybrid", label: "Hybrid" },
          ]}
        />

        {/* 🔥 Select category */}
        <SelectInput
          label="Danh mục ngành nghề"
          name="preferred_category"
          value={form.preferred_category}
          onChange={handleChange}
          options={[
            { value: "", label: "— Chọn ngành nghề —" },
            ...categoryOptions,
          ]}
        />

        <TextInput
          label="Mức lương mong muốn"
          name="preferred_salary"
          value={form.preferred_salary}
          onChange={handleChange}
          type="number"
          placeholder="VD: 6.8"
        />

        <MultiSelect
          label="Kỹ năng"
          name="skills"
          value={form.skills}
          options={skillOptions}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {candidate ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
