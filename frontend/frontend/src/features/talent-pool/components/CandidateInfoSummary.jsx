import { createElement } from "react";
import { Briefcase, GraduationCap, Mail, MapPin, Phone, Timer } from "lucide-react";

function formatExperience(value) {
  if (value === null || value === undefined || value === "") return null;
  const years = Number(value);
  if (Number.isNaN(years)) return String(value);
  return `${years} năm kinh nghiệm`;
}

export default function CandidateInfoSummary({ candidate, compact = false }) {
  const user = candidate?.user || {};
  const email = user.account?.email;
  const phone = user.phone;
  const address = user.address;
  const desiredRole = candidate?.desired_role;
  const experience = formatExperience(candidate?.experience_years);
  const education = candidate?.education_level;

  const items = [
    email && { icon: Mail, label: email, tone: "text-blue-700 bg-blue-50 border-blue-100" },
    phone && { icon: Phone, label: phone, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    address && { icon: MapPin, label: address, tone: "text-slate-700 bg-slate-50 border-slate-100" },
    desiredRole && { icon: Briefcase, label: desiredRole, tone: "text-violet-700 bg-violet-50 border-violet-100" },
    experience && { icon: Timer, label: experience, tone: "text-amber-700 bg-amber-50 border-amber-100" },
    education && { icon: GraduationCap, label: education, tone: "text-indigo-700 bg-indigo-50 border-indigo-100" },
  ].filter(Boolean);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Chưa có thông tin liên hệ hoặc hồ sơ nhanh.
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : ""}`}>
      {items.map(({ icon: Icon, label, tone }) => (
        <span
          key={`${label}`}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
          title={label}
        >
          {createElement(Icon, { className: "h-3.5 w-3.5 shrink-0" })}
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}
