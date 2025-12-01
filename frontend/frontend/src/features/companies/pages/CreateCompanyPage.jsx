import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import JoditEditor from "jodit-react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import CompanyAPI from "@/features/companies/CompanyAPI";
import IndustryAPI from "@/features/industry/IndustryAPI";
import SkillAPI from "@/features/skills/SkillAPI";
import { Card, CardHeader, CardBody } from "@/components/common/Card";
import FileUpload from "@/components/common/FileUpload";
import MultiSelect from "@/components/common/MultiSelect";
const MySwal = withReactContent(Swal);

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

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
    // nhiều ngành & nhiều skill
    industry_ids: [],
    skill_ids: [],
  });

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

  const [logoFile, setLogoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [existingLicenseUrl, setExistingLicenseUrl] = useState("");

  // Load danh sách industries + skills
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
        console.error("❌ Lỗi tải danh sách ngành / kỹ năng:", err);
        MySwal.fire({
          title: "Lỗi",
          text: "Không thể tải danh sách ngành và kỹ năng. Vui lòng thử lại.",
          icon: "error",
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Load dữ liệu công ty khi edit
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
          founded_date: data.founded_date
            ? data.founded_date.split("T")[0]
            : "",
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
        console.error("❌ Lỗi tải thông tin công ty:", err);
        await MySwal.fire({
          title: "Lỗi",
          text: "Không thể tải thông tin công ty để chỉnh sửa.",
          icon: "error",
        });
        navigate("/recruiter/company");
      } finally {
        setInitialLoading(false);
      }
    };

    loadCompany();
  }, [isEdit, id, navigate]);

  // Handle thay đổi input (TextInput, SelectInput, MultiSelect, DatePicker)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Chỉ bắt buộc logo & license khi tạo mới
    if (!isEdit && !logoFile) {
      await MySwal.fire({
        title: "Thiếu logo",
        text: "Công ty bắt buộc phải có logo.",
        icon: "warning",
      });
      return;
    }

    if (!isEdit && !licenseFile) {
      await MySwal.fire({
        title: "Thiếu giấy phép",
        text: "Vui lòng tải lên giấy phép kinh doanh (PDF).",
        icon: "warning",
      });
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      // append các field đơn
      Object.entries(form).forEach(([key, val]) => {
        if (key === "industry_ids" || key === "skill_ids") return;
        data.append(key, val ?? "");
      });

      // append mảng industry_ids & skill_ids (nhiều giá trị)
      (form.industry_ids || []).forEach((id) => {
        data.append("industry_ids", String(id));
      });

      (form.skill_ids || []).forEach((id) => {
        data.append("skill_ids", String(id));
      });

      // file
      if (logoFile) data.append("logo", logoFile);
      if (licenseFile) data.append("licenseFile", licenseFile);

      if (isEdit) {
        await CompanyAPI.update(id, data);
      } else {
        await CompanyAPI.create(data);
      }

      await MySwal.fire({
        title: "Thành công!",
        text: isEdit
          ? "Thông tin công ty đã được cập nhật."
          : "Công ty đã được tạo.",
        icon: "success",
        confirmButtonText: "OK",
      });

      // quay về trang hiển thị thông tin
      navigate("/recruiter/company");
    } catch (err) {
      console.error("❌ Lỗi tạo/cập nhật công ty:", err);
      console.error("❌ Backend trả về:", err.response?.data);
      await MySwal.fire({
        title: "Lỗi!",
        text:
          err?.response?.data?.message ||
          (isEdit ? "Không thể cập nhật công ty." : "Không thể tạo công ty."),
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEdit ? "Chỉnh sửa công ty" : "Tạo công ty mới"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isEdit
                  ? "Cập nhật thông tin doanh nghiệp của bạn."
                  : "Nhập thông tin doanh nghiệp của bạn để bắt đầu tuyển dụng"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/recruiter/company")}
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
            {/* ROW 1: Thông tin chung */}
            <Card>
              <CardHeader icon="🏢" title="Thông tin chung" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TextInput
                    label="Tên công ty"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <TextInput
                    label="Website"
                    name="website"
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

                <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">
                  <div>
                    {isEdit && existingLogoUrl && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-1">
                          Logo hiện tại
                        </p>
                        <img
                          src={existingLogoUrl}
                          alt="Logo hiện tại"
                          className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                      </div>
                    )}
                    <FileUpload
                      label="Logo công ty"
                      accept="image/png,image/jpeg,image/jpg"
                      previewType="image"
                      onFileChange={setLogoFile}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mô tả công ty
                    </label>
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
                </div>
              </CardBody>
            </Card>

            {/* ROW 2: Địa điểm & Liên hệ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Địa điểm & Quy mô */}
              <Card>
                <CardHeader icon="📍" title="Địa điểm & Quy mô" />
                <CardBody>
                  <div className="space-y-4">
                    <TextInput
                      label="Trụ sở chính"
                      name="headquarters"
                      value={form.headquarters}
                      onChange={handleChange}
                      placeholder="TP.HCM, Hà Nội..."
                    />
                    <TextInput
                      label="Địa chỉ"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Số nhà, đường, quận/huyện..."
                    />
                    <SelectInput
                      label="Quy mô công ty"
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                      placeholder="Chọn quy mô"
                      options={[
                        { value: "small", label: "Nhỏ (1-50 nhân sự)" },
                        { value: "medium", label: "Vừa (51-200 nhân sự)" },
                        { value: "large", label: "Lớn (200+ nhân sự)" },
                      ]}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Thông tin liên hệ */}
              <Card>
                <CardHeader icon="📞" title="Thông tin liên hệ" />
                <CardBody>
                  <div className="space-y-4">
                    <TextInput
                      label="Email liên hệ"
                      name="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={handleChange}
                      placeholder="hr@example.com"
                    />
                    <TextInput
                      label="Số điện thoại"
                      name="contact_phone"
                      value={form.contact_phone}
                      onChange={handleChange}
                      placeholder="VD: 090xxxxxxx"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* ROW 3: Lĩnh vực & Tech Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lĩnh vực hoạt động */}
              <Card>
                <CardHeader icon="🧩" title="Lĩnh vực hoạt động" />
                <CardBody>
                  <MultiSelect
                    label="Chọn lĩnh vực"
                    name="industry_ids"
                    value={form.industry_ids}
                    onChange={handleChange}
                    options={industries}
                    placeholder="Chọn 1 hoặc nhiều lĩnh vực"
                  />
                </CardBody>
              </Card>

              {/* Tech Stack */}
              <Card>
                <CardHeader icon="🛠️" title="Tech Stack" />
                <CardBody>
                  <MultiSelect
                    label="Chọn kỹ năng / công nghệ"
                    name="skill_ids"
                    value={form.skill_ids}
                    onChange={handleChange}
                    options={skills}
                    placeholder="Chọn các công nghệ công ty đang dùng"
                  />
                </CardBody>
              </Card>
            </div>

            {/* ROW 4: Thông tin pháp lý */}
            <Card>
              <CardHeader icon="📄" title="Thông tin pháp lý" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TextInput
                    label="Mã số doanh nghiệp"
                    name="business_code"
                    value={form.business_code}
                    onChange={handleChange}
                  />
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

                <div className="mt-6 space-y-2">
                  {isEdit && existingLicenseUrl && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">
                        Giấy phép hiện tại
                      </p>
                      <a
                        href={existingLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Xem giấy phép hiện tại
                      </a>
                    </div>
                  )}

                  <FileUpload
                    label="Giấy phép kinh doanh (PDF)"
                    accept="application/pdf"
                    previewType="file"
                    onFileChange={setLicenseFile}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Chỉ hỗ trợ file PDF, dung lượng tối đa 5MB.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

