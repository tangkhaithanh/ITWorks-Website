import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import JoditEditor from "jodit-react";

// Components
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
// Lưu ý: Tôi dùng thẻ div bao ngoài thay vì Card component cũ để custom layout linh hoạt hơn,
// nhưng vẫn giữ style clean. Nếu bạn bắt buộc dùng Card component của hệ thống, hãy bọc nội dung vào đó.
import MultiSelect from "@/components/common/MultiSelect";

// APIs
import JobAPI from "@/features/jobs/JobAPI";
import SkillAPI from "@/features/skills/SkillAPI";
import JobCategoryAPI from "../../jobCategories/JobCategoryAPI";

const MySwal = withReactContent(Swal);

// --- CONSTANTS ---
const WORK_MODE_OPTIONS = [
  { id: "onsite", name: "🏢 Làm việc tại văn phòng (Onsite)" },
  { id: "remote", name: "🏠 Làm việc từ xa (Remote)" },
  { id: "hybrid", name: "🌐 Kết hợp (Hybrid)" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { id: "intern", name: "Intern" },
  { id: "fresher", name: "Fresher" },
  { id: "junior", name: "Junior" },
  { id: "mid", name: "Middle" },
  { id: "senior", name: "Senior" },
  { id: "lead", name: "Lead" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "fulltime", label: "Toàn thời gian (Full-time)" },
  { value: "parttime", label: "Bán thời gian (Part-time)" },
  { value: "intern", label: "Thực tập (Intern)" },
  { value: "contract", label: "Hợp đồng (Contract)" },
];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // --- STATE ---
  const [form, setForm] = useState({
    title: "",
    employment_type: "",
    category_id: "",
    salary_min: "",
    salary_max: "",
    negotiable: true,
    location_city: "",
    location_district: "",
    location_ward: "",
    location_street: "",
    work_modes: [],
    experience_levels: [],
    deadline: "",
    description: "",
    requirements: "",
    skill_ids: [],
    number_of_openings: 1,
  });

  const [salaryType, setSalaryType] = useState("negotiable");
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // --- EDITOR CONFIG ---
  const editorConfig = {
    readonly: false,
    minHeight: 300,
    placeholder: "Nhập nội dung chi tiết...",
    toolbarAdaptive: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    allowPaste: true,
    buttons: [
      "bold", "italic", "underline", "|",
      "ul", "ol", "|",
      "fontsize", "paragraph", "brush", "|",
      "link", "table", "|",
      "align", "undo", "redo", "|",
      "hr", "eraser", "fullsize"
    ],
  };

  // --- EFFECTS ---
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const skillRes = await SkillAPI.getAll();
        setSkills(skillRes.data?.data || []);
      } catch (err) {
        console.error("❌ Lỗi tải skills:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await JobCategoryAPI.getAll();
        setCategories(
          (res.data?.data || []).map((cat) => ({
            value: String(cat.id),
            label: cat.name,
          }))
        );
      } catch (err) {
        console.error("❌ Lỗi tải categories:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setInitialLoading(false);
      return;
    }
    const loadJob = async () => {
      try {
        const res = await JobAPI.getJobToEdit(id);
        const data = res.data?.data;
        setForm((prev) => ({
          ...prev,
          title: data.title || "",
          category_id: data.category_id ? String(data.category_id) : "",
          employment_type: data.employment_type || "",
          salary_min: data.salary_min !== null ? String(data.salary_min) : "",
          salary_max: data.salary_max !== null ? String(data.salary_max) : "",
          negotiable: data.negotiable ?? false,
          location_city: data.location_city || "",
          location_district: data.location_district || "",
          location_ward: data.location_ward || "",
          location_street: data.location_street || "",
          work_modes: data.work_modes || [],
          experience_levels: data.experience_levels || [],
          deadline: data.deadline ? data.deadline.split("T")[0] : "",
          description: data.details?.description ?? data.description ?? "",
          requirements: data.details?.requirements ?? data.requirements ?? "",
          skill_ids: Array.isArray(data.skill_ids)
            ? data.skill_ids.map((v) => String(v))
            : data.skills
              ? data.skills.map((s) => String(s.id))
              : [],
          number_of_openings: data.number_of_openings ?? 1,
        }));
        setSalaryType(data.negotiable ? "negotiable" : "range");
      } catch (err) {
        console.error("❌ Lỗi tải job:", err);
        navigate("/recruiter/jobs");
      } finally {
        setInitialLoading(false);
      }
    };
    loadJob();
  }, [isEdit, id, navigate]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Logic chuyển đổi kiểu lương (UI Tabs)
  const setSalaryMode = (mode) => {
    setSalaryType(mode);
    setForm((prev) => ({ ...prev, negotiable: mode === "negotiable" }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        work_modes: form.work_modes || [],
        experience_levels: form.experience_levels || [],
        skill_ids: form.skill_ids || [],
      };

      if (salaryType === "negotiable") {
        payload.negotiable = true;
        delete payload.salary_min;
        delete payload.salary_max;
      } else {
        payload.negotiable = false;
        if (payload.salary_min === "") delete payload.salary_min;
        if (payload.salary_max === "") delete payload.salary_max;
      }

      if (!payload.deadline) delete payload.deadline;
      if (!payload.number_of_openings) delete payload.number_of_openings;

      if (isEdit) {
        await JobAPI.update(id, payload);
      } else {
        await JobAPI.create(payload);
      }

      await MySwal.fire({
        title: "Thành công!",
        text: isEdit ? "Cập nhật thành công." : "Tạo công việc mới thành công.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3b82f6",
      });

      navigate("/recruiter/jobs");
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: "Lỗi!",
        text: err?.response?.data?.message || "Có lỗi xảy ra.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingOptions || (isEdit && initialLoading)) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // --- RENDER HELPERS ---
  const SectionTitle = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
      <span className="text-xl">{icon}</span>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa tin tuyển dụng" : "Đăng tin tuyển dụng mới"}
            </h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              {isEdit ? "Cập nhật thông tin chi tiết cho job" : "Điền đầy đủ thông tin để thu hút ứng viên"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => navigate("/recruiter/jobs")}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="min-w-[120px] shadow-md shadow-blue-500/20"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu
                </span>
              ) : (
                "Đăng tin"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* === LEFT COLUMN (MAIN CONTENT) === */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. General Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <SectionTitle icon="📝" title="Thông tin chung" />
              <div className="space-y-6">
                <TextInput
                  label="Tiêu đề công việc"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="VD: Senior Frontend Developer (ReactJS)"
                  className="text-lg font-medium"
                />

                {/* Editors */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Mô tả công việc</label>
                  <div className="prose max-w-none border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <JoditEditor
                      value={form.description}
                      config={editorConfig}
                      onBlur={(newContent) => setForm((prev) => ({ ...prev, description: newContent }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Yêu cầu ứng viên</label>
                  <div className="prose max-w-none border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <JoditEditor
                      value={form.requirements}
                      config={editorConfig}
                      onBlur={(newContent) => setForm((prev) => ({ ...prev, requirements: newContent }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Location */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <SectionTitle icon="📍" title="Địa điểm làm việc" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <TextInput
                  label="Thành phố / Tỉnh"
                  name="location_city"
                  value={form.location_city}
                  onChange={handleChange}
                  required
                  placeholder="VD: Hồ Chí Minh"
                />
                <TextInput
                  label="Quận / Huyện"
                  name="location_district"
                  value={form.location_district}
                  onChange={handleChange}
                  placeholder="VD: Quận 1"
                />
                <TextInput
                  label="Phường / Xã"
                  name="location_ward"
                  value={form.location_ward}
                  onChange={handleChange}
                  placeholder="VD: Phường Bến Nghé"
                />
                <TextInput
                  label="Số nhà, Tên đường"
                  name="location_street"
                  value={form.location_street}
                  onChange={handleChange}
                  placeholder="VD: 123 Nguyễn Huệ"
                />
              </div>
            </div>

          </div>

          {/* === RIGHT COLUMN (SIDEBAR / METADATA) === */}
          <div className="lg:col-span-1 space-y-6">

            {/* 3. Publishing Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                🚀 Thông tin đăng tuyển
              </h4>
              <div className="space-y-4">
                <SelectInput
                  label="Danh mục nghề nghiệp"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  options={categories}
                  required
                  placeholder="-- Chọn danh mục --"
                />

                <div className="grid grid-cols-2 gap-4">
                  <SelectInput
                    label="Loại hình"
                    name="employment_type"
                    value={form.employment_type}
                    onChange={handleChange}
                    options={EMPLOYMENT_TYPE_OPTIONS}
                    required
                    placeholder="-- Chọn --"
                  />
                  <TextInput
                    label="Số lượng"
                    name="number_of_openings"
                    type="number"
                    min={1}
                    value={form.number_of_openings}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* 4. Salary & Deadline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                💰 Lương & Hạn nộp
              </h4>
              <div className="space-y-5">
                {/* Custom Salary Switch */}
                <div className="bg-slate-100 p-1 rounded-lg flex relative">
                  <button
                    onClick={() => setSalaryMode("negotiable")}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-200 ${salaryType === "negotiable"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Thỏa thuận
                  </button>
                  <button
                    onClick={() => setSalaryMode("range")}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-200 ${salaryType === "range"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Nhập mức lương
                  </button>
                </div>

                {salaryType === "range" && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <TextInput
                      label="Tối thiểu (VNĐ)"
                      name="salary_min"
                      type="number"
                      value={form.salary_min}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <TextInput
                      label="Tối đa (VNĐ)"
                      name="salary_max"
                      type="number"
                      value={form.salary_max}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <DatePickerInput
                    label="Hạn nộp hồ sơ"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* 5. Attributes (Skills, Levels, Modes) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                🎯 Yêu cầu chi tiết
              </h4>
              <div className="space-y-5">
                <MultiSelect
                  label="Kỹ năng chuyên môn"
                  name="skill_ids"
                  value={form.skill_ids}
                  onChange={handleChange}
                  options={skills}
                  placeholder="Chọn kỹ năng..."
                />

                <MultiSelect
                  label="Cấp độ kinh nghiệm"
                  name="experience_levels"
                  value={form.experience_levels}
                  onChange={handleChange}
                  options={EXPERIENCE_LEVEL_OPTIONS}
                  placeholder="Chọn cấp độ..."
                />

                <MultiSelect
                  label="Hình thức làm việc"
                  name="work_modes"
                  value={form.work_modes}
                  onChange={handleChange}
                  options={WORK_MODE_OPTIONS}
                  placeholder="Chọn hình thức..."
                />
              </div>
            </div>

          </div> {/* End Right Column */}
        </div>
      </div>
    </div>
  );
}