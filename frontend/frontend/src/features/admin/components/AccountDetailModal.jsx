import { useState } from "react";
import Modal from "@/components/ui/Modal";
// Nếu InfoRow cũ không fit style mới, bạn có thể dùng DetailItem bên dưới, 
// hoặc giữ nguyên InfoRow nếu nó đủ linh hoạt. 
// Ở đây mình sẽ viết lại component hiển thị dòng nhỏ để tối ưu style.
import {
    Building2,
    UserRound,
    Users,
    ShieldCheck,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Globe,
    Hash,
    Copy,
    Check,
    Clock
} from "lucide-react";
import Button from "@/components/ui/Button"; // Giả sử bạn có component này

// ==========================
// UTILS (Giữ nguyên logic của bạn)
// ==========================
function getAccountDisplayInfo(account) {
    if (!account) {
        return { name: "Chưa cập nhật", image: null, initial: "U", type: "user" };
    }
    let name = "Chưa cập nhật";
    let image = null;
    let type = "user";

    if (account.user) {
        name = account.user.full_name || name;
        image = account.user.avatar_url;
    } else if (account.company) {
        name = account.company.name || name;
        image = account.company.logo_url;
        type = "company";
    }
    const initial = name.charAt(0).toUpperCase();
    return { name, image, initial, type };
}

const ROLE_LABELS = { admin: "Quản trị viên", recruiter: "Nhà tuyển dụng", candidate: "Ứng viên" };
const STATUS_LABELS = { active: "Hoạt động", pending: "Chờ duyệt", banned: "Đã khóa" };

function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}
function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("vi-VN");
}
function getGenderLabel(gender) {
    const map = { male: "Nam", female: "Nữ", other: "Khác" };
    return map[gender] || "—";
}
function getCompanySizeLabel(size) {
    const map = { small: "Nhỏ (1-50)", medium: "Vừa (51-200)", large: "Lớn (>200)" };
    return map[size] || "—";
}
function getCompanyStatusLabel(status) {
    const map = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", hidden: "Ẩn" };
    return map[status] || "—";
}

// ==========================
// SUB-COMPONENTS FOR UI
// ==========================

// 1. Badge hiển thị trạng thái/role đẹp hơn
const StatusBadge = ({ status, type = 'status' }) => {
    let styles = "bg-slate-100 text-slate-600";
    let label = status;
    let Icon = null;

    if (type === 'role') {
        label = ROLE_LABELS[status] || status;
        if (status === 'admin') { styles = "bg-purple-50 text-purple-700 border-purple-100"; Icon = ShieldCheck; }
        if (status === 'recruiter') { styles = "bg-indigo-50 text-indigo-700 border-indigo-100"; Icon = Users; }
        if (status === 'candidate') { styles = "bg-sky-50 text-sky-700 border-sky-100"; Icon = UserRound; }
    } else {
        label = STATUS_LABELS[status] || status;
        if (status === 'active') { styles = "bg-emerald-50 text-emerald-700 border-emerald-100"; Icon = Check; }
        if (status === 'pending') { styles = "bg-amber-50 text-amber-700 border-amber-100"; Icon = Clock; }
        if (status === 'banned') { styles = "bg-rose-50 text-rose-700 border-rose-100"; Icon = ShieldCheck; }
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </span>
    );
};

// 2. Dòng thông tin chi tiết (Thay thế InfoRow để flex style hơn)
const DetailItem = ({ icon: Icon, label, value, isLink, isCopyable, className = "" }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-50 last:border-0 ${className}`}>
            <div className="w-40 shrink-0 flex items-center gap-2 text-sm text-slate-500 font-medium">
                {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                {label}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
                {isLink && value ? (
                    <a href={value.includes('@') ? `mailto:${value}` : value} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline truncate">
                        {value}
                    </a>
                ) : (
                    <span className="text-sm text-slate-900 font-medium break-words">{value || "—"}</span>
                )}

                {isCopyable && value && (
                    <button
                        onClick={handleCopy}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        title="Sao chép"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// 3. Section Container
const Section = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
        {title && (
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{title}</h3>
            </div>
        )}
        <div className="p-5 flex flex-col">
            {children}
        </div>
    </div>
);

// ==========================
// MAIN COMPONENT
// ==========================
export default function AccountDetailModal({ open, onClose, account, loading }) {
    const { name, image, initial, type } = getAccountDisplayInfo(account);
    const hasUser = !!account?.user;
    const hasCompany = !!account?.company;
    const SystemInfoSection = () => (
        <Section title="Thông tin hệ thống">
            <DetailItem icon={Mail} label="Email đăng nhập" value={account.email} isCopyable />
            <DetailItem icon={Calendar} label="Ngày tạo" value={formatDateTime(account.created_at)} />
            <DetailItem icon={Clock} label="Cập nhật cuối" value={formatDateTime(account.updated_at)} />
            <DetailItem
                icon={ShieldCheck}
                label="Yêu cầu đổi pass"
                value={account.must_change_password ? "Có" : "Không"}
                className={account.must_change_password ? "text-amber-600 font-semibold" : ""}
            />
        </Section>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Chi tiết hồ sơ"
            width="max-w-4xl"
        >
            {/* --- SỬA Ở DÒNG DƯỚI ĐÂY --- */}
            {/* Thay -m-6 thành -mx-6 -mb-6 để không bị tràn lên trên */}
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar bg-slate-50/50 -mx-6 -mb-6">

                {/* LOADING STATE */}
                {loading && (
                    <div className="p-6 space-y-6 animate-pulse">
                        <div className="h-32 bg-slate-200 rounded-xl w-full" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-60 bg-slate-200 rounded-xl" />
                            <div className="h-60 bg-slate-200 rounded-xl" />
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {!loading && !account && (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <ShieldCheck className="w-10 h-10 text-slate-300" />
                        <p>Không tìm thấy dữ liệu tài khoản.</p>
                    </div>
                )}

                {/* CONTENT */}
                {!loading && account && (
                    <div className="pb-8">
                        {/* 1. HEADER HERO SECTION */}
                        {/* Thêm border-t để tách biệt rõ hơn với tiêu đề modal nếu cần */}
                        <div className="relative bg-white border-b border-t border-slate-200">
                            {/* Decorative Background */}
                            <div className="h-12 w-full" />


                            <div className="px-8 pb-6 -mt-10 flex flex-col md:flex-row items-start md:items-end gap-5">
                                {/* Avatar */}
                                <div className={`w-24 h-24 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold overflow-hidden ${type === "company" ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"
                                    }`}>
                                    {image ? (
                                        <img src={image} alt={name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                    ) : (
                                        type === "company" ? <Building2 className="w-10 h-10" /> : initial
                                    )}
                                </div>

                                {/* Meta Info */}
                                <div className="flex-1 min-w-0 pb-1">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                        <h2 className="text-2xl font-bold text-slate-900 truncate">{name}</h2>
                                        <div className="flex gap-2">
                                            <StatusBadge status={account.role} type="role" />
                                            <StatusBadge status={account.status} type="status" />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-4 h-4" />
                                            <span>{account.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            <Hash className="w-3 h-3" />
                                            ID: {account.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. MAIN GRID */}
                        <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* LOGIC MỚI: Nếu là CÔNG TY -> Hồ sơ bên TRÁI, Hệ thống bên PHẢI */}
                            {hasCompany ? (
                                <>
                                    {/* CỘT TRÁI: HỒ SƠ DOANH NGHIỆP */}
                                    <div className="space-y-6">
                                        <Section title="Hồ sơ doanh nghiệp">
                                            <DetailItem icon={Building2} label="Tên công ty" value={account.company.name} />
                                            <DetailItem icon={Globe} label="Website" value={account.company.website} isLink />
                                            <DetailItem icon={Hash} label="Mã số thuế" value={account.company.business_code} isCopyable />
                                            <DetailItem icon={Users} label="Quy mô" value={getCompanySizeLabel(account.company.size)} />
                                            <DetailItem icon={MapPin} label="Trụ sở" value={account.company.headquarters} />

                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Thông tin liên hệ</p>
                                                <DetailItem icon={Mail} label="Email liên hệ" value={account.company.contact_email} isLink isCopyable />
                                                <DetailItem icon={Phone} label="SĐT liên hệ" value={account.company.contact_phone} isCopyable />
                                            </div>
                                        </Section>
                                    </div>

                                    {/* CỘT PHẢI: HỆ THỐNG */}
                                    <div className="space-y-6">
                                        <SystemInfoSection />
                                    </div>
                                </>
                            ) : (
                                /* LOGIC CŨ CHO USER: Hệ thống bên TRÁI, Hồ sơ bên PHẢI */
                                <>
                                    <div className="space-y-6">
                                        <SystemInfoSection />
                                    </div>

                                    <div className="space-y-6">
                                        {hasUser ? (
                                            <Section title="Hồ sơ cá nhân">
                                                <DetailItem icon={UserRound} label="Họ và tên" value={account.user.full_name} />
                                                <DetailItem icon={Phone} label="Số điện thoại" value={account.user.phone} isCopyable />
                                                <DetailItem icon={Calendar} label="Ngày sinh" value={formatDate(account.user.dob)} />
                                                <DetailItem icon={UserRound} label="Giới tính" value={getGenderLabel(account.user.gender)} />
                                                <DetailItem icon={MapPin} label="Địa chỉ" value={account.user.address} />
                                            </Section>
                                        ) : (
                                            <div className="border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-400 h-full">
                                                <UserRound className="w-10 h-10 text-slate-300 mb-3" />
                                                <p className="text-sm font-medium">Chưa có hồ sơ liên kết</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}