import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import JoditEditor from "jodit-react";

import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { Card, CardHeader, CardBody } from "@/components/common/Card";
import MultiSelect from "@/components/common/MultiSelect";

import JobAPI from "@/features/jobs/JobAPI";
import SkillAPI from "@/features/skills/SkillAPI";

const MySwal = withReactContent(Swal);

// Hình thức làm việc (enum WorkMode) → hiển thị tiếng Việt
const WORK_MODE_OPTIONS = [
  { id: "onsite", name: "Làm việc tại văn phòng (Onsite)" },
  { id: "remote", name: "Làm việc từ xa (Remote)" },
  // nếu backend có hybrid thì bật thêm dòng dưới
  { id: "hybrid", name: "Kết hợp Onsite/Remote (Hybrid)" },
];

// Cấp độ kinh nghiệm (enum ExperienceLevel)
// Bạn có thể bổ sung thêm nếu enum có nhiều hơn
const EXPERIENCE_LEVEL_OPTIONS = [
  { id: "junior", name: "Junior" },
  { id: "mid", name: "Middle (Mid)" },
  { id: "senior", name: "Senior" },
  { id: "lead", name: "Lead" },
  { id: "fresher", name: "Fresher" },
  { id: "intern", name: "Intern" },
];

// Loại hình công việc (enum EmploymentType)
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "fulltime", label: "Toàn thời gian (Full-time)" },
  { value: "parttime", label: "Bán thời gian (Part-time)" },
  { value: "intern", label: "Thực tập (Intern)" },
  { value: "contract", label: "Hợp đồng (Contract)" }
];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    employment_type: "",
    // lương
    salary_min: "",
    salary_max: "",
    negotiable: true,
    // địa điểm
    location_city: "",
    location_district: "",
    location_ward: "",
    location_street: "",
    // work modes & exp levels
    work_modes: [],
    experience_levels: [],
    // deadline
    deadline: "",
    // mô tả chi tiết
    description: "",
    requirements: "",
    // kỹ năng
    skill_ids: [],
    // số lượng tuyển
    number_of_openings: 1,
  });

  // radio: "negotiable" | "range"
  const [salaryType, setSalaryType] = useState("negotiable");

  const [skills, setSkills] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const editorConfig = {
    readonly: false,
    minHeight: 200,
    toolbarAdaptive: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    allowPaste: true,
    buttons: [
      "bold",
      "italic",
      "underline",
      "|",
      "ul",
      "ol",
      "|",
      "fontsize",
      "paragraph",
      "link",
      "align",
      "|",
      "undo",
      "redo",
      "hr",
      "eraser",
    ],
  };

  // Load danh sách skills (MultiSelect)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const skillRes = await SkillAPI.getAll();
        setSkills(skillRes.data?.data || []);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách kỹ năng:", err);
        MySwal.fire({
          title: "Lỗi",
          text: "Không thể tải danh sách kỹ năng. Vui lòng thử lại.",
          icon: "error",
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Load dữ liệu job khi edit
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
          employment_type: data.employment_type || "",
          salary_min:
            data.salary_min !== null && data.salary_min !== undefined
              ? String(data.salary_min)
              : "",
          salary_max:
            data.salary_max !== null && data.salary_max !== undefined
              ? String(data.salary_max)
              : "",
          negotiable: data.negotiable ?? false,
          location_city: data.location_city || "",
          location_district: data.location_district || "",
          location_ward: data.location_ward || "",
          location_street: data.location_street || "",
          work_modes: data.work_modes || [],
          experience_levels: data.experience_levels || [],
          deadline: data.deadline ? data.deadline.split("T")[0] : "",
          description:
            data.details?.description ??
            data.description ??
            "",
          requirements:
            data.details?.requirements ??
            data.requirements ??
            "",
          skill_ids: Array.isArray(data.skill_ids)
            ? data.skill_ids.map((v) => String(v))
            : data.skills
            ? data.skills.map((s) => String(s.id))
            : [],
          number_of_openings:
            data.number_of_openings !== undefined &&
            data.number_of_openings !== null
              ? data.number_of_openings
              : 1,
        }));

        setSalaryType(data.negotiable ? "negotiable" : "range");
      } catch (err) {
        console.error("❌ Lỗi tải thông tin job:", err);
        await MySwal.fire({
          title: "Lỗi",
          text: "Không thể tải thông tin công việc để chỉnh sửa.",
          icon: "error",
        });
        navigate("/recruiter/jobs");
      } finally {
        setInitialLoading(false);
      }
    };

    loadJob();
  }, [isEdit, id, navigate]);

  // Handle thay đổi input (TextInput, SelectInput, MultiSelect, DatePicker)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSalaryTypeChange = (e) => {
    const value = e.target.value; // "negotiable" | "range"
    setSalaryType(value);
    setForm((prev) => ({
      ...prev,
      negotiable: value === "negotiable",
    }));
  };

  const handleSubmit = async () => {
    // có thể tự check thêm required ở FE, tạm để backend validate
    try {
      setSaving(true);

      // build payload phù hợp DTO backend
      const payload = {
        ...form,
        // đảm bảo mảng cho các field JSON
        work_modes: form.work_modes || [],
        experience_levels: form.experience_levels || [],
        skill_ids: form.skill_ids || [],
      };

      // xử lý lương theo radio
      if (salaryType === "negotiable") {
        payload.negotiable = true;
        // không gửi lương cho backend (để backend tự xử lý / giữ nguyên nếu update)
        delete payload.salary_min;
        delete payload.salary_max;
      } else {
        payload.negotiable = false;
        // để trống thì cho backend báo lỗi theo ValidateIf
        if (payload.salary_min === "") delete payload.salary_min;
        if (payload.salary_max === "") delete payload.salary_max;
      }

      // deadline: nếu rỗng thì bỏ khỏi payload
      if (!payload.deadline) {
        delete payload.deadline;
      }

      // number_of_openings: nếu rỗng thì bỏ, để default = 1
      if (!payload.number_of_openings) {
        delete payload.number_of_openings;
      }

      if (isEdit) {
        await JobAPI.update(id, payload);
      } else {
        await JobAPI.create(payload);
      }

      await MySwal.fire({
        title: "Thành công!",
        text: isEdit
          ? "Công việc đã được cập nhật."
          : "Công việc đã được tạo.",
        icon: "success",
        confirmButtonText: "OK",
      });

      navigate("/recruiter/jobs");
    } catch (err) {
      console.error("❌ Lỗi tạo/cập nhật job:", err);
      console.error("❌ Backend trả về:", err.response?.data);
      await MySwal.fire({
        title: "Lỗi!",
        text:
          err?.response?.data?.message ||
          (isEdit
            ? "Không thể cập nhật công việc."
            : "Không thể tạo công việc."),
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingOptions || (isEdit && initialLoading)) {
    return (
      <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Đang tải dữ liệu...</p>
      </div>
    );
    }

  return (
    <div className="bg-slate-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEdit ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isEdit
                  ? "Cập nhật thông tin công việc."
                  : "Nhập thông tin công việc để bắt đầu đăng tuyển."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/recruiter/jobs")}
              >
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>

          {/* Nội dung form */}
          <div className="p-6 space-y-6">
            {/* Thông tin cơ bản */}
            <Card>
              <CardHeader icon="📄" title="Thông tin cơ bản" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TextInput
                    label="Tiêu đề công việc"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="VD: Backend Developer (Node.js)"
                  />

                  <SelectInput
                    label="Loại hình công việc"
                    name="employment_type"
                    value={form.employment_type}
                    onChange={handleChange}
                    placeholder="Chọn loại hình"
                    options={EMPLOYMENT_TYPE_OPTIONS}
                    required
                  />

                  <TextInput
                    label="Số lượng cần tuyển"
                    name="number_of_openings"
                    type="number"
                    min={1}
                    value={form.number_of_openings}
                    onChange={handleChange}
                    placeholder="VD: 3"
                  />
                </div>
              </CardBody>
            </Card>

            {/* Lương + hình thức làm việc + kinh nghiệm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lương & Deadline */}
              <Card>
                <CardHeader icon="💰" title="Mức lương & Hạn nộp" />
                <CardBody>
                  {/* Lương */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">
                      Mức lương
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="radio"
                              name="salaryType"
                              value="negotiable"
                              checked={salaryType === "negotiable"}
                              onChange={handleSalaryTypeChange}
                              className="w-4 h-4 text-blue-600 border-slate-300"
                            />
                            <span>Thỏa thuận</span>
                          </label>

                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="radio"
                              name="salaryType"
                              value="range"
                              checked={salaryType === "range"}
                              onChange={handleSalaryTypeChange}
                              className="w-4 h-4 text-blue-600 border-slate-300"
                            />
                            <span>Nhập khoảng lương</span>
                          </label>
                        </div>
                      </div>

                      {salaryType === "range" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextInput
                            label="Lương tối thiểu (VND)"
                            name="salary_min"
                            type="number"
                            value={form.salary_min}
                            onChange={handleChange}
                            placeholder="VD: 15000000"
                          />
                          <TextInput
                            label="Lương tối đa (VND)"
                            name="salary_max"
                            type="number"
                            value={form.salary_max}
                            onChange={handleChange}
                            placeholder="VD: 25000000"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mt-6">
                    <DatePickerInput
                      label="Hạn nộp hồ sơ"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleChange}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Hình thức làm việc & cấp độ */}
              <Card>
                <CardHeader icon="🧩" title="Hình thức làm việc & cấp độ" />
                <CardBody>
                  <div className="space-y-4">
                    <MultiSelect
                      label="Hình thức làm việc"
                      name="work_modes"
                      value={form.work_modes}
                      onChange={handleChange}
                      options={WORK_MODE_OPTIONS}
                      placeholder="Chọn 1 hoặc nhiều hình thức"
                    />

                    <MultiSelect
                      label="Cấp độ kinh nghiệm"
                      name="experience_levels"
                      value={form.experience_levels}
                      onChange={handleChange}
                      options={EXPERIENCE_LEVEL_OPTIONS}
                      placeholder="Chọn cấp độ kinh nghiệm"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Địa điểm làm việc */}
            <Card>
              <CardHeader icon="📍" title="Địa điểm làm việc" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <TextInput
                    label="Thành phố / Tỉnh"
                    name="location_city"
                    value={form.location_city}
                    onChange={handleChange}
                    required
                    placeholder="VD: TP.HCM"
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
                    label="Địa chỉ chi tiết"
                    name="location_street"
                    value={form.location_street}
                    onChange={handleChange}
                    placeholder="VD: 123 Nguyễn Huệ"
                  />
                </div>
              </CardBody>
            </Card>

            {/* Mô tả & Yêu cầu */}
            <Card>
              <CardHeader icon="📝" title="Mô tả & Yêu cầu" />
              <CardBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Mô tả công việc
                    </p>
                    <div className="border rounded-2xl bg-white shadow-sm p-2 hover:shadow-md transition-all">
                      <JoditEditor
                        value={form.description}
                        config={editorConfig}
                        onBlur={(newContent) =>
                          setForm((prev) => ({
                            ...prev,
                            description: newContent,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Yêu cầu ứng viên
                    </p>
                    <div className="border rounded-2xl bg-white shadow-sm p-2 hover:shadow-md transition-all">
                      <JoditEditor
                        value={form.requirements}
                        config={editorConfig}
                        onBlur={(newContent) =>
                          setForm((prev) => ({
                            ...prev,
                            requirements: newContent,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Kỹ năng liên quan */}
            <Card>
              <CardHeader icon="🛠️" title="Kỹ năng liên quan" />
              <CardBody>
                <MultiSelect
                  label="Chọn kỹ năng / công nghệ"
                  name="skill_ids"
                  value={form.skill_ids}
                  onChange={handleChange}
                  options={skills}
                  placeholder="Chọn các kỹ năng mà job yêu cầu"
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
