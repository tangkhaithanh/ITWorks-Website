export const PAGE_SIZE = 8;

export const DEFAULT_MATCH_FILTERS = {
  minScore: 40,
  matchedSkills: [],
  status: "all",
};

export const MATCHING_MODES = {
  job_rank_applicants: {
    title: "Rank Applicants",
    description: "Xếp hạng những ứng viên đã apply vào job này",
    tone: "blue",
  },
  job_find_talent: {
    title: "Find Talent",
    description: "Tìm thêm ứng viên phù hợp trong toàn bộ CV pool",
    tone: "violet",
  },
};

export const JOB_STATUS_META = {
  active: {
    label: "Đang mở",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  hidden: {
    label: "Đang ẩn",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  closed: {
    label: "Đã đóng",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  expired: {
    label: "Hết hạn",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export const APPLICATION_STATUS_META = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  interviewing: {
    label: "Interviewing",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const RESULT_SORT_OPTIONS = [
  { value: "overall_score", label: "Overall Score" },
  { value: "semantic_score", label: "Semantic Score" },
  { value: "experience_score", label: "Experience Score" },
  { value: "location_score", label: "Location Score" },
  { value: "salary_score", label: "Salary Score" },
];
