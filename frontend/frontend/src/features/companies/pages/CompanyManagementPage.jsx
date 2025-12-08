// src/features/companies/pages/CompanyManagementPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  CalendarDays,
  Users,
  Edit3,
  Layers,
  Cpu,
  Loader2,
  PlusCircle,
  Briefcase,
  ExternalLink
} from "lucide-react";

import Button from "@/components/ui/Button";
import CompanyAPI from "@/features/companies/CompanyAPI";
import { Card, CardBody } from "@/components/common/Card";
import TagList from "@/components/common/TagList";

export default function CompanyManagementPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const navigate = useNavigate();

  const fetchCompany = async () => {
    try {
      const res = await CompanyAPI.getMyCompany();
      setCompany(res.data?.data || null);
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  // =======================
  //    LOADING STATE
  // =======================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải thông tin doanh nghiệp...</p>
        </div>
      </div>
    );
  }

  // =======================
  //    EMPTY STATE
  // =======================
  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Hồ sơ công ty trống
          </h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Bạn cần cập nhật thông tin công ty để bắt đầu đăng tin tuyển dụng và thu hút ứng viên.
          </p>
          <Button
            onClick={() => navigate("/recruiter/company/create")}
            className="w-full justify-center gap-2 py-2.5"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo hồ sơ công ty
          </Button>
        </div>
      </div>
    );
  }

  // =======================
  //    DATA PREPARATION
  // =======================
  const foundedYear = company.founded_date ? company.founded_date.split("T")[0] : "Chưa cập nhật";
  const industries = company.industry_info?.map((i) => i.industry?.name) || [];
  const skills = company.skills?.map((i) => i.skill?.name) || [];

  return (
    <div className="bg-slate-50/50 min-h-screen pb-12">
      {/* ================================================
        1. HEADER SECTION (Banner + Avatar + Title)
        ================================================
      */}
      <div className="bg-white border-b border-slate-200">
        {/* Cover Background */}
        <div className="h-44 w-full bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-6 right-6 z-10">
            <Button
              variant="white"
              onClick={() => navigate(`/recruiter/company/${company.id}/edit`)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-none gap-2 flex items-center text-xs px-3 py-2"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="relative flex flex-col md:flex-row items-end -mt-10 gap-6">
            {/* Logo Box */}
            <div className="relative flex-shrink-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-indigo-50 border-4 border-white shadow-lg flex items-center justify-center text-indigo-400">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Title Info */}
            <div className="flex-1 w-full md:w-auto text-center md:text-left pb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-3 text-sm text-slate-600">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group"
                  >
                    <Globe className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span className="truncate max-w-[200px] font-medium">{company.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{company.size || "Quy mô chưa cập nhật"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================
        2. GRID LAYOUT (MASONRY STYLE)
        Sử dụng Grid để lấp đầy không gian, tránh khoảng trống
        ================================================
      */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ROW 1: INFO CARDS (3 Columns) - Ngang hàng nhau */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Contact */}
          <Card className="border-slate-200 shadow-sm h-full hover:border-indigo-200 transition-colors">
            <CardBody className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Liên hệ</h3>
              </div>
              <div className="space-y-3 flex-1">
                <InfoItem icon={Mail} label="Email" value={company.contact_email} isLink href={`mailto:${company.contact_email}`} />
                <InfoItem icon={Phone} label="Điện thoại" value={company.contact_phone} isLink href={`tel:${company.contact_phone}`} />
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Legal Info */}
          <Card className="border-slate-200 shadow-sm h-full hover:border-indigo-200 transition-colors">
            <CardBody className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Pháp lý</h3>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Mã số thuế</span>
                  <span className="text-sm font-medium text-slate-900">{company.business_code || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Đại diện</span>
                  <span className="text-sm font-medium text-slate-900">{company.representative_name || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Chức vụ</span>
                  <span className="text-sm font-medium text-slate-900">
                    {company.representative_position || "—"}
                  </span>
                </div>
                {company.license_file_url && (
                  <div className="pt-2 mt-auto">
                    <a href={company.license_file_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-indigo-600 hover:underline font-medium">
                      <FileText className="w-3 h-3" /> Xem giấy phép KD
                    </a>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Address */}
          <Card className="border-slate-200 shadow-sm h-full hover:border-indigo-200 transition-colors">
            <CardBody className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Địa chỉ</h3>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Trụ sở chính</span>
                  <span className="text-sm text-slate-900 line-clamp-2">{company.headquarters || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Địa chỉ làm việc</span>
                  <span className="text-sm text-slate-900 line-clamp-2">{company.address || "—"}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ROW 2: DESCRIPTION (Full Width) - Luôn nằm giữa, không bị lệch */}
        <Card className="border-slate-200 shadow-sm">
          <CardBody className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Giới thiệu công ty</h3>
            </div>

            {company.description ? (
              <div
                className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: company.description }}
              />
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-400 italic">Chưa cập nhật mô tả giới thiệu.</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* ROW 3: TAGS & SKILLS (Grid 2 Columns) - Chia đều bên dưới */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Industry */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900">Lĩnh vực hoạt động</h3>
              </div>
              {industries.length > 0 ? (
                <TagList items={industries} color="blue" />
              ) : (
                <p className="text-slate-400 text-sm italic">Chưa cập nhật thông tin</p>
              )}
            </CardBody>
          </Card>

          {/* Tech Stack */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900">Tech Stack & Kỹ năng</h3>
              </div>
              {skills.length > 0 ? (
                <TagList items={skills} color="emerald" />
              ) : (
                <p className="text-slate-400 text-sm italic">Chưa cập nhật thông tin</p>
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}

// =======================
//   SUB COMPONENTS
// =======================

function InfoItem({ icon: Icon, label, value, isLink, href }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 group">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-indigo-500 transition-colors" />
      <div className="flex-1 overflow-hidden">
        {isLink ? (
          <a href={href} className="text-sm text-slate-700 hover:text-indigo-600 font-medium truncate block transition-colors">
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-700 font-medium break-words">{value}</p>
        )}
      </div>
    </div>
  );
}