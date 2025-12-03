// src/features/candidates/pages/CandidateProfilePage.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import CandidateAPI from "../CandidateAPI";
import Swal from "sweetalert2";
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  GraduationCap,
  Globe,
  User,
  Edit3,
  Camera,
  Eye,
  Upload,
} from "lucide-react"; // Cần cài: npm install lucide-react

// Giả định các component UI của bạn (giữ nguyên import)
import { Card, CardBody } from "@/components/common/Card";
import TagList from "@/components/common/TagList";
import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/ui/Button";
import EditPersonalInfoModal from "../components/EditPersonalInfoModal";

// 🆕 Modal avatar
import AvatarPreviewModal from "../components/AvatarPreviewModal";
import AvatarUploadModal from "../components/AvatarUploadModal";

// --- UTILS ---
const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa cập nhật"
    : date.toLocaleDateString("vi-VN");
};

const formatCurrency = (value) => {
  if (value == null) return "Thương lượng";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${Number(value).toLocaleString("vi-VN")} đ`;
  }
};

const MAPS = {
  gender: { male: "Nam", female: "Nữ", other: "Khác" },
  workMode: {
    onsite: "Tại văn phòng",
    remote: "Làm việc từ xa",
    hybrid: "Linh hoạt (Hybrid)",
  },
};

// --- SUB-COMPONENTS ---

// 1. Skeleton Loader
const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-48 bg-slate-200 rounded-xl w-full relative">
      <div className="absolute -bottom-10 left-8 w-24 h-24 bg-slate-300 rounded-full border-4 border-white"></div>
    </div>
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-64 bg-slate-200 rounded-xl"></div>
      <div className="h-64 bg-slate-200 rounded-xl lg:col-span-2"></div>
    </div>
  </div>
);

// 2. Info Item
const ProfileInfoItem = ({ icon: Icon, label, value, isLink }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg">
    <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
      <Icon size={16} />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">
        {label}
      </p>
      {isLink ? (
        <a
          href={`mailto:${value}`}
          className="text-sm font-semibold text-blue-600 hover:underline truncate block"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-700 truncate">
          {value || "Chưa cập nhật"}
        </p>
      )}
    </div>
  </div>
);

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);

  // 🆕 Avatar states
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [showAvatarUploadModal, setShowAvatarUploadModal] = useState(false);
  const avatarMenuRef = useRef(null);

  const reloadProfile = async () => {
    try {
      const res = await CandidateAPI.getProfile();
      setProfile(res?.data?.data ?? res?.data);
    } catch (err) {
      console.error("Lỗi tải lại hồ sơ:", err);
    }
  };

  const handleUpdatedUser = async () => {
    await reloadProfile();
  };

  const handleOpenEdit = () => {
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await CandidateAPI.getProfile();
        setProfile(res?.data?.data ?? res?.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải hồ sơ. Vui lòng thử lại.");
        Swal.fire({
          icon: "error",
          title: "Đã xảy ra lỗi",
          text: "Không thể tải dữ liệu hồ sơ.",
          confirmButtonColor: "#2563eb",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 🆕 Đóng menu avatar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target)
      ) {
        setAvatarMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Data processing
  const candidate = profile?.candidate;

  const skillNames = useMemo(() => {
    return (
      candidate?.skills
        ?.map((item) => {
          if (!item) return null;
          return typeof item === "string"
            ? item
            : item.skill?.name || item.name;
        })
        .filter(Boolean) || []
    );
  }, [candidate]);

  const isJobPreferencesEmpty = useMemo(() => {
    if (!candidate) return true;
    return (
      !candidate.preferred_city &&
      !candidate.preferred_work_mode &&
      !candidate.preferred_category &&
      !candidate.preferred_salary &&
      !candidate.education &&
      !candidate.experience &&
      skillNames.length === 0
    );
  }, [candidate, skillNames]);

  const avatarUrl =
    profile?.avatar_url || "https://i.pravatar.cc/150?img=12";

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Hồ sơ của tôi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý thông tin cá nhân và thiết lập gợi ý việc làm
          </p>
        </div>

        {/* LOADING STATE */}
        {loading && <ProfileSkeleton />}

        {/* ERROR STATE */}
        {!loading && error && (
          <Card className="border-red-100 bg-red-50">
            <CardBody>
              <EmptyState
                text={error}
                icon={<div className="text-red-500 text-4xl">⚠️</div>}
              />
            </CardBody>
          </Card>
        )}

        {/* MAIN CONTENT */}
        {!loading && !error && profile && (
          <div className="space-y-6">
            {/* 1. COVER & AVATAR BANNER */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-visible">
              {/* Cover Gradient */}
               <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

               <div className="px-6 pb-6 relative flex flex-col md:flex-row items-end md:items-center gap-6">
                {/* Avatar + menu */}
                <div
                  className="-mt-16 relative z-20"      // 👈 thêm z-20 cho container avatar
                  ref={avatarMenuRef}
                >
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((prev) => !prev)}
                    className="relative group focus:outline-none"
                  >
                    <img
                      src={avatarUrl}
                      alt={profile.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white cursor-pointer"
                    />

                    {/* overlay hover */}
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                      <Camera
                        size={22}
                        className="text-white opacity-0 group-hover:opacity-100 transition"
                      />
                    </div>
                  </button>

                  {/* Online dot */}
                  <div
                    className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"
                    title="Online"
                  />

                  {/* 🆕 Avatar menu */}
                  {avatarMenuOpen && (
                    <div
                      className="
                        absolute left-1/2 -translate-x-1/2 top-full mt-3 
                        w-52 bg-white rounded-2xl shadow-xl border border-slate-200 
                        z-50 overflow-hidden
                      "                             // 👈 thêm z-50 cho menu
                    >
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          setShowAvatarPreview(true);
                        }}
                      >
                        <Eye size={16} className="text-slate-600" />
                        <span>Xem ảnh</span>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-t border-slate-100"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          setShowAvatarUploadModal(true);
                        }}
                      >
                        <Upload size={16} className="text-slate-600" />
                        <span>Tải lên ảnh khác</span>
                      </button>
                    </div>
                  )}
                </div>
                {/* Basic Info Header */}
                <div className="flex-1 w-full text-center md:text-left pt-2 md:pt-0">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {profile.full_name}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-slate-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Mail size={14} /> {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {profile.phone}
                      </span>
                    )}
                    {profile.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {profile.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mb-2 md:mb-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2 border-slate-300 text-slate-50"
                    type="button"
                    onClick={handleOpenEdit}
                  >
                    <Edit3 size={16} /> Chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. GRID LAYOUT: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN: Personal Details */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="h-full">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <User className="text-blue-600" size={20} />
                    <h3 className="font-bold text-slate-800">
                      Thông tin chi tiết
                    </h3>
                  </div>
                  <CardBody className="p-4 pt-2">
                    <ProfileInfoItem
                      icon={Calendar}
                      label="Ngày sinh"
                      value={formatDate(profile.dob)}
                    />
                    <ProfileInfoItem
                      icon={User}
                      label="Giới tính"
                      value={
                        MAPS.gender[profile.gender] ||
                        profile.gender
                      }
                    />
                    <ProfileInfoItem
                      icon={Globe}
                      label="Quốc tịch"
                      value="Việt Nam"
                    />
                    <ProfileInfoItem
                      icon={MapPin}
                      label="Địa chỉ"
                      value={profile.address}
                    />
                  </CardBody>
                </Card>
              </div>

              {/* RIGHT COLUMN: Job Preferences */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="h-full relative overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2">
                      <Briefcase
                        className="text-emerald-600"
                        size={20}
                      />
                      <div>
                        <h3 className="font-bold text-slate-800">
                          Hồ sơ nghề nghiệp
                        </h3>
                        <p className="text-xs text-slate-500">
                          Thông tin dùng để gợi ý việc làm phù hợp
                        </p>
                      </div>
                    </div>
                    {!isJobPreferencesEmpty && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="shadow-sm shadow-blue-200"
                      >
                        Cập nhật
                      </Button>
                    )}
                  </div>

                  <CardBody className="p-6">
                    {!candidate || isJobPreferencesEmpty ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                          <Briefcase size={32} />
                        </div>
                        <h4 className="text-slate-800 font-medium mb-2">
                          Chưa có thông tin nghề nghiệp
                        </h4>
                        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                          Hãy cập nhật kỹ năng, mức lương và địa điểm
                          mong muốn để chúng tôi gợi ý những cơ hội tốt
                          nhất cho bạn.
                        </p>

                        <Button
                          variant="primary"
                          size="sm"
                          className="shadow-sm shadow-blue-200"
                        >
                          Thêm thông tin
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Grid thông tin chính */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                          <ProfileInfoItem
                            icon={MapPin}
                            label="Thành phố làm việc"
                            value={candidate.preferred_city}
                          />
                          <ProfileInfoItem
                            icon={Briefcase}
                            label="Hình thức"
                            value={
                              MAPS.workMode[
                                candidate.preferred_work_mode
                              ] || candidate.preferred_work_mode
                            }
                          />
                          <ProfileInfoItem
                            icon={DollarSign}
                            label="Mức lương kỳ vọng"
                            value={formatCurrency(
                              candidate.preferred_salary
                            )}
                          />
                          <ProfileInfoItem
                            icon={GraduationCap}
                            label="Học vấn"
                            value={candidate.education}
                          />
                          <ProfileInfoItem
                            icon={Briefcase}
                            label="Ngành nghề"
                            value={
                              candidate.preferred_category
                                ? `Ngành nghề ID #${candidate.preferred_category}`
                                : null
                            }
                          />
                          <ProfileInfoItem
                            icon={Calendar}
                            label="Kinh nghiệm"
                            value={candidate.experience}
                          />
                        </div>

                        {/* Skills Section */}
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            Kỹ năng chuyên môn
                          </p>
                          {skillNames.length > 0 ? (
                            <TagList
                              items={skillNames}
                              color="emerald"
                            />
                          ) : (
                            <p className="text-sm text-slate-400 italic">
                              Chưa cập nhật kỹ năng
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* 🆕 Modal xem ảnh avatar */}
            <AvatarPreviewModal
              open={showAvatarPreview}
              onClose={() => setShowAvatarPreview(false)}
              imageUrl={avatarUrl}
              fullName={profile?.full_name}
            />

            {/* 🆕 Modal upload + crop avatar */}
            <AvatarUploadModal
              open={showAvatarUploadModal}
              onClose={() => setShowAvatarUploadModal(false)}
              currentAvatarUrl={avatarUrl}
              onUploaded={handleUpdatedUser}
            />
          </div>
        )}

        <EditPersonalInfoModal
          open={openEditModal}
          onClose={() => handleCloseEdit()}
          profile={profile}
          onUpdated={handleUpdatedUser}
        />
      </div>
    </div>
  );
}
