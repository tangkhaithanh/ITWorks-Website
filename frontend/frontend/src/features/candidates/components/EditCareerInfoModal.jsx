import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import MultiSelect from "@/components/common/MultiSelect";
import Button from "@/components/ui/Button";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import Swal from "sweetalert2";

const EDUCATION_LEVEL_OPTIONS = [
  { value: "", label: "— Chọn trình độ —" },
  { value: "high_school", label: "Trung học" },
  { value: "college", label: "Cao đẳng" },
  { value: "bachelor", label: "Đại học" },
  { value: "master", label: "Thạc sĩ" },
  { value: "doctorate", label: "Tiến sĩ" },
  { value: "other", label: "Khác" },
];

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
    desired_role: "",
    desired_salary_min: "",
    desired_salary_max: "",
    experience_years: "",
    education_level: "",
    open_to_work: true,
    skills: [],
  });

  useEffect(() => {
    if (candidate) {
      setForm({
        preferred_city: candidate.preferred_city || "",
        preferred_work_mode: candidate.preferred_work_mode || "",
        preferred_category: candidate.preferred_category
          ? String(candidate.preferred_category)
          : "",
        preferred_salary: candidate.preferred_salary ?? "",
        desired_role: candidate.desired_role || "",
        desired_salary_min: candidate.desired_salary_min ?? "",
        desired_salary_max: candidate.desired_salary_max ?? "",
        experience_years: candidate.experience_years ?? "",
        education_level: candidate.education_level || "",
        open_to_work:
          typeof candidate.open_to_work === "boolean"
            ? candidate.open_to_work
            : true,
        skills: candidate.skills?.map((s) => String(s.skill_id)) || [],
      });
    } else {
      setForm({
        preferred_city: "",
        preferred_work_mode: "",
        preferred_category: "",
        preferred_salary: "",
        desired_role: "",
        desired_salary_min: "",
        desired_salary_max: "",
        experience_years: "",
        education_level: "",
        open_to_work: true,
        skills: [],
      });
    }
  }, [candidate, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    const desiredSalaryMin =
      form.desired_salary_min === "" ? null : Number(form.desired_salary_min);
    const desiredSalaryMax =
      form.desired_salary_max === "" ? null : Number(form.desired_salary_max);

    if (
      desiredSalaryMin != null &&
      desiredSalaryMax != null &&
      desiredSalaryMax < desiredSalaryMin
    ) {
      Swal.fire({
        icon: "warning",
        title: "Khoảng lương chưa hợp lệ",
        text: "Mức lương tối đa phải lớn hơn hoặc bằng mức tối thiểu.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      const payload = {
        preferred_city: form.preferred_city || null,
        preferred_work_mode: form.preferred_work_mode || null,
        preferred_category: form.preferred_category
          ? Number(form.preferred_category)
          : null,
        preferred_salary:
          form.preferred_salary === "" ? null : Number(form.preferred_salary),
        desired_role: form.desired_role || null,
        desired_salary_min: desiredSalaryMin,
        desired_salary_max: desiredSalaryMax,
        experience_years:
          form.experience_years === "" ? null : Number(form.experience_years),
        education_level: form.education_level || null,
        open_to_work: Boolean(form.open_to_work),
        skills: form.skills.map((id) => Number(id)),
      };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Vị trí mong muốn"
            name="desired_role"
            value={form.desired_role}
            onChange={handleChange}
            placeholder="VD: Frontend Developer"
          />

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
            label="Mức lương tham chiếu"
            name="preferred_salary"
            value={form.preferred_salary}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.1"
            placeholder="VD: 15"
          />

          <TextInput
            label="Số năm kinh nghiệm"
            name="experience_years"
            value={form.experience_years}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.5"
            placeholder="VD: 2.5"
          />

          <TextInput
            label="Lương mong muốn tối thiểu"
            name="desired_salary_min"
            value={form.desired_salary_min}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.1"
            placeholder="VD: 18"
          />

          <TextInput
            label="Lương mong muốn tối đa"
            name="desired_salary_max"
            value={form.desired_salary_max}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.1"
            placeholder="VD: 25"
          />

          <div className="md:col-span-2">
            <SelectInput
              label="Trình độ học vấn"
              name="education_level"
              value={form.education_level}
              onChange={handleChange}
              options={EDUCATION_LEVEL_OPTIONS}
            />
          </div>
        </div>

        <MultiSelect
          label="Kỹ năng"
          name="skills"
          value={form.skills}
          options={skillOptions}
          onChange={handleChange}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Trạng thái tìm việc
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, open_to_work: true }))
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                form.open_to_work
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="font-semibold">Đang mở cơ hội</div>
              <div className="text-sm opacity-80">
                Sẵn sàng nhận đề xuất công việc mới
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, open_to_work: false }))
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                !form.open_to_work
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="font-semibold">Tạm thời chưa</div>
              <div className="text-sm opacity-80">
                Chưa muốn nhận thêm cơ hội lúc này
              </div>
            </button>
          </div>
        </div>

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
