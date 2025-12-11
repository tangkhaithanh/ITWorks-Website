import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import JoditEditor from "jodit-react";
import {
  Building2,
  Globe,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Cpu,
  Briefcase,
  FileText,
  Save,
  ChevronLeft,
  ImageIcon,
  LayoutDashboard
} from "lucide-react";

// Components
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FileUpload from "@/components/common/FileUpload";
import MultiSelect from "@/components/common/MultiSelect";

// APIs
import CompanyAPI from "@/features/companies/CompanyAPI";
import IndustryAPI from "@/features/industry/IndustryAPI";
import SkillAPI from "@/features/skills/SkillAPI";

const MySwal = withReactContent(Swal);

// --- UI COMPONENTS (Local) ---
// Card Component tùy chỉnh để đồng bộ style
const Card = ({ children, title, icon: Icon, className = "", subtitle }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ${className}`}>
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm ring-1 ring-blue-100">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 font-normal">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // --- STATE ---
  const [form, setForm] = useState({
    name: "",
    website: "",
    founded_date: "",
    description: "",
    headquarters: "",
    address: "",
    size: "",
    contact_email: "",
    contact_phone: "",
    business_code: "",
    representative_name: "",
    representative_position: "",
    industry_ids: [],
    skill_ids: [],
  });

  // Editor Config
  const editorConfig = {
    readonly: false,
    minHeight: 250,
    placeholder: "Giới thiệu về văn hóa, tầm nhìn, sứ mệnh...",
    toolbarAdaptive: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_as_html",
    buttons: [
      "bold", "italic", "underline", "|",
      "ul", "ol", "|",
      "fontsize", "paragraph", "brush", "|",
      "link", "align", "|",
      "undo", "redo", "hr", "fullsize"
    ],
  };

  const [logoFile, setLogoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [existingLicenseUrl, setExistingLicenseUrl] = useState("");

  // --- EFFECTS ---
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [indRes, skillRes] = await Promise.all([
          IndustryAPI.getAll(),
          SkillAPI.getAll(),
        ]);
        setIndustries(indRes.data?.data || []);
        setSkills(skillRes.data?.data || []);
      } catch (err) {
        console.error("❌ Lỗi tải options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setInitialLoading(false);
      return;
    }
    const loadCompany = async () => {
      try {
        const res = await CompanyAPI.getForEdit(id);
        const data = res.data?.data;
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          website: data.website || "",
          founded_date: data.founded_date ? data.founded_date.split("T")[0] : "",
          description: data.description || "",
          headquarters: data.headquarters || "",
          address: data.address || "",
          size: data.size || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          business_code: data.business_code || "",
          representative_name: data.representative_name || "",
          representative_position: data.representative_position || "",
          industry_ids: data.industry_ids || [],
          skill_ids: data.skill_ids || [],
        }));
        setExistingLogoUrl(data.logo_url || "");
        setExistingLicenseUrl(data.license_file_url || "");
      } catch (err) {
        console.error("❌ Lỗi tải company:", err);
        navigate("/recruiter/company");
      } finally {
        setInitialLoading(false);
      }
    };
    loadCompany();
  }, [isEdit, id, navigate]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!isEdit && !logoFile) {
      await MySwal.fire({ title: "Thiếu logo", text: "Vui lòng tải lên logo công ty.", icon: "warning" });
      return;
    }
    if (!isEdit && !licenseFile) {
      await MySwal.fire({ title: "Thiếu giấy phép", text: "Vui lòng tải lên giấy phép kinh doanh (PDF).", icon: "warning" });
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === "industry_ids" || key === "skill_ids") return;
        data.append(key, val ?? "");
      });
      (form.industry_ids || []).forEach((id) => data.append("industry_ids", String(id)));
      (form.skill_ids || []).forEach((id) => data.append("skill_ids", String(id)));

      if (logoFile) data.append("logo", logoFile);
      if (licenseFile) data.append("licenseFile", licenseFile);

      if (isEdit) {
        await CompanyAPI.update(id, data);
      } else {
        await CompanyAPI.create(data);
      }

      await MySwal.fire({
        title: "Thành công!",
        text: isEdit ? "Thông tin công ty đã được cập nhật." : "Tạo công ty thành công.",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
      navigate("/recruiter/company");
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải dữ liệu doanh nghiệp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans pb-20">

      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/recruiter/company")}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {isEdit ? "Cập nhật hồ sơ công ty" : "Khởi tạo hồ sơ doanh nghiệp"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`inline-block w-2 h-2 rounded-full ${isEdit ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                {isEdit ? "Chế độ chỉnh sửa" : "Thiết lập mới"}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="hidden sm:flex bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
              onClick={() => navigate("/recruiter/company")}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Lưu...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  Lưu hồ sơ
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* --- Main Content Grid --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* === LEFT COLUMN (2 Cols Span) === */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. Thông tin chung */}
            <Card icon={Building2} title="Thông tin chung" subtitle="Các thông tin cơ bản hiển thị công khai">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <TextInput
                    label="Tên công ty"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="VD: Công ty Cổ phần Công nghệ ABC"
                    className="text-lg font-medium"
                  />
                </div>
                <TextInput
                  label="Website"
                  name="website"
                  icon={<Globe size={16} />}
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://..."
                />
                <DatePickerInput
                  label="Ngày thành lập"
                  name="founded_date"
                  value={form.founded_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Giới thiệu công ty</label>
                <div className="prose-editor border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <JoditEditor
                    value={form.description}
                    config={editorConfig}
                    onBlur={(newContent) => setForm((prev) => ({ ...prev, description: newContent }))}
                  />
                </div>
              </div>
            </Card>

            {/* 2. Địa điểm & Quy mô */}
            <Card icon={MapPin} title="Địa điểm & Quy mô">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput
                    label="Trụ sở chính"
                    name="headquarters"
                    value={form.headquarters}
                    onChange={handleChange}
                    placeholder="VD: Hà Nội"
                  />
                  <SelectInput
                    label="Quy mô nhân sự"
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    placeholder="Chọn quy mô"
                    options={[
                      { value: "small", label: "Startup / Nhỏ (1-50 nhân sự)" },
                      { value: "medium", label: "Vừa (51-200 nhân sự)" },
                      { value: "large", label: "Lớn (200+ nhân sự)" },
                      { value: "enterprise", label: "Tập đoàn (1000+ nhân sự)" },
                    ]}
                  />
                </div>
                <TextInput
                  label="Địa chỉ chi tiết"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                />
              </div>
            </Card>

            {/* 3. Lĩnh vực & Tech Stack */}
            <Card icon={Cpu} title="Chuyên môn & Lĩnh vực">
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <MultiSelect
                    label="Lĩnh vực hoạt động (Industries)"
                    name="industry_ids"
                    value={form.industry_ids}
                    onChange={handleChange}
                    options={industries}
                    placeholder="Chọn lĩnh vực..."
                  />
                </div>
                <div>
                  <MultiSelect
                    label="Tech Stack / Kỹ năng sử dụng"
                    name="skill_ids"
                    value={form.skill_ids}
                    onChange={handleChange}
                    options={skills}
                    placeholder="VD: ReactJS, NodeJS, AWS..."
                  />
                  <p className="text-xs text-slate-500 mt-2">Việc chọn đúng Tech Stack giúp hệ thống gợi ý ứng viên phù hợp hơn.</p>
                </div>
              </div>
            </Card>

          </div>

          {/* === RIGHT COLUMN (1 Col Span) === */}
          <div className="lg:col-span-1 space-y-8">

            {/* 4. Logo (Identity) - Move to Top Right for Visibility */}
            <Card icon={ImageIcon} title="Nhận diện thương hiệu">
              <div className="flex flex-col items-center">
                {isEdit && existingLogoUrl && (
                  <div className="mb-4 relative group">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                      <img
                        src={existingLogoUrl}
                        alt="Current Logo"
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                    <div className="absolute -bottom-2 w-full text-center">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">Hiện tại</span>
                    </div>
                  </div>
                )}

                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {isEdit ? "Thay đổi Logo" : "Upload Logo"} <span className="text-red-500">*</span>
                  </label>
                  <FileUpload
                    accept="image/png,image/jpeg,image/jpg"
                    previewType="image"
                    onFileChange={setLogoFile}
                    className="bg-slate-50 border-dashed border-2 border-slate-300 hover:bg-white transition-colors"
                  />
                </div>
              </div>
            </Card>

            {/* 5. Contact Info */}
            <Card icon={Phone} title="Liên hệ tuyển dụng">
              <div className="space-y-4">
                <TextInput
                  label="Email liên hệ"
                  name="contact_email"
                  type="email"
                  icon={<Mail size={16} />}
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="hr@company.com"
                />
                <TextInput
                  label="Số điện thoại"
                  name="contact_phone"
                  icon={<Phone size={16} />}
                  value={form.contact_phone}
                  onChange={handleChange}
                  placeholder="0901234567"
                />
              </div>
            </Card>

            {/* 6. Legal Info */}
            <Card icon={ShieldCheck} title="Thông tin pháp lý" className="border-blue-200/50 shadow-blue-100">
              <div className="space-y-5">
                <TextInput
                  label="Mã số thuế / KD"
                  name="business_code"
                  value={form.business_code}
                  onChange={handleChange}
                  placeholder="031xxxxxxx"
                />

                <div className="grid grid-cols-1 gap-4">
                  <TextInput
                    label="Người đại diện"
                    name="representative_name"
                    value={form.representative_name}
                    onChange={handleChange}
                  />
                  <TextInput
                    label="Chức vụ"
                    name="representative_position"
                    value={form.representative_position}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Giấy phép kinh doanh (PDF) {!isEdit && <span className="text-red-500">*</span>}
                  </label>

                  {isEdit && existingLicenseUrl && (
                    <a
                      href={existingLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium mb-3 hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      <FileText size={16} />
                      Xem giấy phép hiện tại
                    </a>
                  )}

                  <FileUpload
                    accept="application/pdf"
                    previewType="file"
                    onFileChange={setLicenseFile}
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Hỗ trợ file .PDF, tối đa 5MB.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}