import {
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  BadgeCheck,
  ShieldAlert,
  Clock3,
  UserRound,
  Building2,
  FileText,
} from "lucide-react";

export const NOTIFICATION_TYPE_META = {
  application: {
    label: "Ứng tuyển",
    icon: FileText,
    iconClassName: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
    pillClassName: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  interview: {
    label: "Phỏng vấn",
    icon: CalendarClock,
    iconClassName: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
    pillClassName: "bg-violet-50 text-violet-700 border border-violet-100",
  },
  job: {
    label: "Tin tuyển dụng",
    icon: BriefcaseBusiness,
    iconClassName: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
    pillClassName: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  },
  approval: {
    label: "Phê duyệt",
    icon: BadgeCheck,
    iconClassName: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    pillClassName: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  system: {
    label: "Hệ thống",
    icon: ShieldAlert,
    iconClassName: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    pillClassName: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  reminder: {
    label: "Nhắc nhở",
    icon: Clock3,
    iconClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    pillClassName: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  candidate: {
    label: "Ứng viên",
    icon: UserRound,
    iconClassName: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
    pillClassName: "bg-cyan-50 text-cyan-700 border border-cyan-100",
  },
  recruiter: {
    label: "Nhà tuyển dụng",
    icon: Building2,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-100",
    pillClassName: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100",
  },
  company: {
    label: "Công ty",
    icon: Building2,
    iconClassName: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    pillClassName: "bg-sky-50 text-sky-700 border border-sky-100",
  },
  default: {
    label: "Thông báo",
    icon: BellRing,
    iconClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    pillClassName: "bg-slate-100 text-slate-700 border border-slate-200",
  },
};

export function getNotificationTypeMeta(type) {
  return NOTIFICATION_TYPE_META[type] || NOTIFICATION_TYPE_META.default;
}