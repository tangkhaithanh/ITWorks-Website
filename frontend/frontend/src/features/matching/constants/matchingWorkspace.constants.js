export const PAGE_SIZE = 8;

export const DEFAULT_MATCH_FILTERS = {
  minScore: 40,
  matchedSkills: [],
  status: "all",
};

export const MATCHING_MODES = {
  job_rank_applicants: {
    title: "Xếp hạng ứng viên",
    description: "Xếp hạng những ứng viên đã ứng tuyển tin tuyển dụng này",
    tone: "blue",
  },
  job_find_talent: {
    title: "Tìm kiếm ứng viên",
    description: "Tìm thêm ứng viên phù hợp trong toàn bộ kho CV",
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
    label: "Chờ xử lý",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  interviewing: {
    label: "Phỏng vấn",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  accepted: {
    label: "Đã nhận",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const RESULT_SORT_OPTIONS = [
  { value: "overall_score", label: "Điểm tổng thể" },
  { value: "semantic_score", label: "Điểm ngữ nghĩa" },
  { value: "experience_score", label: "Điểm kinh nghiệm" },
  { value: "location_score", label: "Điểm địa điểm" },
  { value: "salary_score", label: "Điểm lương" },
];
