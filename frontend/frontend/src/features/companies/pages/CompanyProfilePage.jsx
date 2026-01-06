import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Building2,
    MapPin,
    Globe,
    Mail,
    Phone,
    Users,
    Briefcase,
    Award,
    ExternalLink,
    ArrowLeft,
    Loader2,
    Calendar,
    TrendingUp,
    Code,
    Target,
    CheckCircle2,
    Share2,
    Bookmark
} from "lucide-react";
import CompanyAPI from "@/features/companies/CompanyAPI";
import JobCard from "@/features/jobs/components/JobCard.jsx";
import toast from "react-hot-toast";

// ============================================================================
// COMPONENT: CompanyHeader - Header với cover image và logo
// ============================================================================
const CompanyHeader = ({ company }) => {
    const sizeLabels = {
        small: "1-50",
        medium: "51-200",
        large: "201-500",
        enterprise: "500+"
    };

    return (
        <div className="relative">
            {/* Cover Image / Gradient Background */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob" />
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-4000" />
                </div>
            </div>

            {/* Company Info Card - Overlapping */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-32 md:-mt-24">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Company Logo */}
                            <div className="shrink-0">
                                <div className="relative">
                                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                                        <img
                                            src={company.logo_url || "/default-company-logo.png"}
                                            alt={company.name}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </div>
                                    {company.status === "approved" && (
                                        <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1.5 shadow-lg">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Company Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">
                                                {company.name}
                                            </h1>
                                            {company.status === "approved" && (
                                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                                                    <Award className="w-3.5 h-3.5" />
                                                    Xác thực
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Info */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                                            {company.headquarters && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{company.headquarters}</span>
                                                </div>
                                            )}

                                            {company.size && (
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{sizeLabels[company.size]} nhân viên</span>
                                                </div>
                                            )}

                                            {company.jobs && company.jobs.length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium text-blue-600">{company.jobs.length} việc làm</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                            title="Chia sẻ"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                            title="Lưu công ty"
                                        >
                                            <Bookmark className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Industries Tags */}
                                {company.industries && company.industries.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {company.industries.slice(0, 3).map((industry, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full"
                                            >
                                                {industry}
                                            </span>
                                        ))}
                                        {company.industries.length > 3 && (
                                            <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
                                                +{company.industries.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* CTA Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {company.website && (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-105"
                                        >
                                            <Globe size={18} />
                                            <span>Website</span>
                                            <ExternalLink size={14} />
                                        </a>
                                    )}

                                    {company.contact_email && (
                                        <a
                                            href={`mailto:${company.contact_email}`}
                                            className="inline-flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-5 py-2.5 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                                        >
                                            <Mail size={18} />
                                            <span>Liên hệ</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: StatCard - Card hiển thị thống kê
// ============================================================================
const StatCard = ({ icon: Icon, label, value, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100"
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: InfoCard - Card thông tin với icon
// ============================================================================
const InfoCard = ({ icon: Icon, label, value, href, isExternal = false }) => {
    const content = (
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                <p className={`text-sm font-semibold break-all ${href ? 'text-blue-600 group-hover:text-blue-700' : 'text-slate-700'}`}>
                    {value}
                    {isExternal && <ExternalLink className="inline-block w-3 h-3 ml-1" />}
                </p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
            >
                {content}
            </a>
        );
    }

    return content;
};

// ============================================================================
// COMPONENT: LoadingSkeleton
// ============================================================================
const LoadingSkeleton = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Skeleton */}
            <div className="h-64 md:h-80 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="-mt-32 md:-mt-24">
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-pulse">
                        <div className="flex gap-6">
                            <div className="w-28 h-28 md:w-32 md:h-32 bg-slate-200 rounded-2xl" />
                            <div className="flex-1 space-y-4">
                                <div className="h-8 bg-slate-200 rounded w-1/3" />
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="flex gap-3">
                                    <div className="h-10 bg-slate-200 rounded-xl w-32" />
                                    <div className="h-10 bg-slate-200 rounded-xl w-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
                                <div className="space-y-3">
                                    <div className="h-4 bg-slate-200 rounded" />
                                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                                    <div className="h-4 bg-slate-200 rounded w-4/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 h-96 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT: CompanyProfilePage
// ============================================================================
const CompanyProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompanyDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await CompanyAPI.getDetail(id);
                setCompany(response.data.data);
            } catch (err) {
                console.error("Fetch company error:", err);
                setError("Không thể tải thông tin công ty");
                toast.error("Không thể tải thông tin công ty");
            } finally {
                setLoading(false);
            }
        };
        fetchCompanyDetail();
    }, [id]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error || !company) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Không tìm thấy công ty
                    </h2>
                    <p className="text-slate-600 mb-8">{error || "Công ty này không tồn tại hoặc đã bị xóa"}</p>
                    <button
                        onClick={() => navigate("/companies")}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <ArrowLeft size={20} />
                        Quay lại danh sách công ty
                    </button>
                </div>
            </div>
        );
    }

    // Transform job data
    const transformedJobs = company.jobs?.map(job => ({
        id: job.id,
        title: job.title,
        company_name: company.name,
        company_logo: company.logo_url,
        location_city: job.location_city,
        category: job.category?.name,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        negotiable: job.negotiable,
        employment_type: job.employment_type,
        deadline: job.deadline,
        created_at: job.created_at,
        status: job.status,
        views: job.views || 0,
        is_hot: job.is_hot || false
    })) || [];

    const activeJobs = transformedJobs.filter(job => job.status === 'active');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Navigation Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Quay lại</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 hidden md:inline">Chia sẻ:</span>
                            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <Share2 size={18} className="text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Header */}
            <CompanyHeader company={company} />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Briefcase}
                        label="Việc làm đang tuyển"
                        value={activeJobs.length}
                        color="blue"
                    />
                    <StatCard
                        icon={Users}
                        label="Quy mô công ty"
                        value={
                            company.size === "small" ? "1-50" :
                                company.size === "medium" ? "51-200" :
                                    company.size === "large" ? "201-500" : "500+"
                        }
                        color="green"
                    />
                    <StatCard
                        icon={Target}
                        label="Lĩnh vực"
                        value={company.industries?.length || 0}
                        color="purple"
                    />
                    <StatCard
                        icon={Code}
                        label="Công nghệ"
                        value={company.tech_stacks?.length || 0}
                        color="orange"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About Company */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Giới thiệu công ty
                                </h2>
                            </div>
                            <div className="p-6">
                                {company.description ? (
                                    <div
                                        className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed
                                                 prose-headings:text-slate-900 prose-headings:font-bold
                                                 prose-p:text-slate-700 prose-p:leading-relaxed
                                                 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                                 prose-strong:text-slate-900 prose-strong:font-semibold
                                                 prose-ul:text-slate-700 prose-ol:text-slate-700"
                                        dangerouslySetInnerHTML={{ __html: company.description }}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">Chưa có thông tin giới thiệu</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tech Stack */}
                        {company.tech_stacks && company.tech_stacks.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Code className="w-5 h-5 text-blue-600" />
                                        Công nghệ sử dụng
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {company.tech_stacks.map((tech, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-200 font-semibold text-sm hover:shadow-md hover:scale-105 transition-all"
                                            >
                                                <Code size={16} />
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Industries */}
                        {company.industries && company.industries.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        Lĩnh vực hoạt động
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {company.industries.map((industry, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 font-semibold text-sm hover:shadow-md hover:scale-105 transition-all"
                                            >
                                                <Target size={16} />
                                                {industry}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Contact & Info */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                    Thông tin liên hệ
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {company.contact_email && (
                                    <InfoCard
                                        icon={Mail}
                                        label="Email"
                                        value={company.contact_email}
                                        href={`mailto:${company.contact_email}`}
                                    />
                                )}

                                {company.contact_phone && (
                                    <InfoCard
                                        icon={Phone}
                                        label="Điện thoại"
                                        value={company.contact_phone}
                                        href={`tel:${company.contact_phone}`}
                                    />
                                )}

                                {company.address && (
                                    <InfoCard
                                        icon={MapPin}
                                        label="Địa chỉ"
                                        value={company.address}
                                    />
                                )}

                                {company.website && (
                                    <InfoCard
                                        icon={Globe}
                                        label="Website"
                                        value={company.website}
                                        href={company.website}
                                        isExternal={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Section */}
                {activeJobs.length > 0 && (
                    <div className="mt-12">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                                <Briefcase className="w-7 h-7 text-blue-600" />
                                Vị trí tuyển dụng
                            </h2>
                            <p className="text-slate-600">
                                {activeJobs.length} vị trí đang tuyển dụng tại {company.name}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {activeJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    isSaved={false}
                                    onToggleSave={() => {}}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* No Jobs Message */}
                {activeJobs.length === 0 && (
                    <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-16 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                Chưa có vị trí tuyển dụng
                            </h3>
                            <p className="text-slate-600">
                                {company.name} hiện tại chưa có vị trí tuyển dụng nào. Hãy theo dõi để cập nhật các cơ hội mới nhất.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Add animation keyframes to your global CSS or tailwind.config.js
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -50px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(50px, 50px) scale(1.05); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
`;
document.head.appendChild(style);

export default CompanyProfilePage;
