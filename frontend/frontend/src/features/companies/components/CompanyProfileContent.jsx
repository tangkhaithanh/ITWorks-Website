import {
    MapPin,
    Mail,
    Phone,
    ShieldCheck,
    FileText,
    Layers,
    Cpu,
    Briefcase,
} from "lucide-react";
import { Card, CardBody } from "@/components/common/Card";
import TagList from "@/components/common/TagList";

// Sub-component nhỏ dùng nội bộ
function InfoItem({ icon: Icon, label, value, isLink, href }) {
    if (!value) return null;

    return (
        <div className="flex items-start gap-3 group">
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-indigo-500 transition-colors" />
            <div className="flex-1 overflow-hidden">
                {isLink ? (
                    <a
                        href={href}
                        className="text-sm text-slate-700 hover:text-indigo-600 font-medium truncate block transition-colors"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="text-sm text-slate-700 font-medium break-words">
                        {value}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function CompanyProfileContent({ company }) {
    // Data Preparation
    const industries = company.industry_info?.map((i) => i.industry?.name) || [];
    const skills = company.skills?.map((i) => i.skill?.name) || [];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* ROW 1: INFO CARDS */}
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
                            <InfoItem
                                icon={Mail}
                                label="Email"
                                value={company.contact_email}
                                isLink
                                href={`mailto:${company.contact_email}`}
                            />
                            <InfoItem
                                icon={Phone}
                                label="Điện thoại"
                                value={company.contact_phone}
                                isLink
                                href={`tel:${company.contact_phone}`}
                            />
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
                                <span className="text-sm font-medium text-slate-900">
                                    {company.business_code || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Đại diện</span>
                                <span className="text-sm font-medium text-slate-900">
                                    {company.representative_name || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Chức vụ</span>
                                <span className="text-sm font-medium text-slate-900">
                                    {company.representative_position || "—"}
                                </span>
                            </div>
                            {company.license_file_url && (
                                <div className="pt-2 mt-auto">
                                    <a
                                        href={company.license_file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                                    >
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
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                    Trụ sở chính
                                </span>
                                <span className="text-sm text-slate-900 line-clamp-2">
                                    {company.headquarters || "—"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                    Địa chỉ làm việc
                                </span>
                                <span className="text-sm text-slate-900 line-clamp-2">
                                    {company.address || "—"}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* ROW 2: DESCRIPTION */}
            <Card className="border-slate-200 shadow-sm">
                <CardBody className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Giới thiệu công ty
                        </h3>
                    </div>

                    {company.description ? (
                        <div
                            className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: company.description }}
                        />
                    ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <p className="text-slate-400 italic">
                                Chưa cập nhật mô tả giới thiệu.
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* ROW 3: TAGS & SKILLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industry */}
                <Card className="border-slate-200 shadow-sm h-full">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900">Lĩnh vực hoạt động</h3>
                        </div>
                        {industries.length > 0 ? (
                            <TagList items={industries} color="blue" />
                        ) : (
                            <p className="text-slate-400 text-sm italic">
                                Chưa cập nhật thông tin
                            </p>
                        )}
                    </CardBody>
                </Card>

                {/* Tech Stack */}
                <Card className="border-slate-200 shadow-sm h-full">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900">Tech Stack & Kỹ năng</h3>
                        </div>
                        {skills.length > 0 ? (
                            <TagList items={skills} color="emerald" />
                        ) : (
                            <p className="text-slate-400 text-sm italic">
                                Chưa cập nhật thông tin
                            </p>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}