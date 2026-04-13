import { getBackendOrigin } from "@/features/matching/MatchingAPI";

export const buildBackendUrl = (path) => {
  if (!path) return "";
  return new URL(path, `${getBackendOrigin()}/`).toString();
};

export const formatPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;

export const formatExactPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

export const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

export const formatSalary = (job) => {
  if (!job || job.negotiable) return "Thỏa thuận";

  const min = Number(job.salary_min);
  const max = Number(job.salary_max);

  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} VND`;
  }

  if (Number.isFinite(min) && min > 0) {
    return `Từ ${min.toLocaleString("vi-VN")} VND`;
  }

  if (Number.isFinite(max) && max > 0) {
    return `Đến ${max.toLocaleString("vi-VN")} VND`;
  }

  return "Thỏa thuận";
};

export const formatExperienceRequired = (job) => {
  const years = Number(job?.experience_required);
  if (!Number.isFinite(years) || years < 0) return "Không yêu cầu cụ thể";
  if (years === 0) return "Dưới 1 năm";
  return `${years} năm kinh nghiệm`;
};

export const getSkillLabel = (skill) => {
  if (typeof skill === "string") return skill.trim();

  if (skill && typeof skill === "object") {
    const rawValue =
      skill.name ?? skill.skill_name ?? skill.label ?? skill.value ?? skill.skill ?? "";
    return String(rawValue).trim();
  }

  if (skill == null) return "";
  return String(skill).trim();
};

export const normalizeSkillValue = (skill) => getSkillLabel(skill).toLocaleLowerCase();

export const normalizeSkillList = (skills) => {
  if (!Array.isArray(skills)) return [];

  const seen = new Set();

  return skills.reduce((result, skill) => {
    const label = getSkillLabel(skill);
    const normalized = normalizeSkillValue(label);

    if (!label || !normalized || seen.has(normalized)) {
      return result;
    }

    seen.add(normalized);
    result.push(label);
    return result;
  }, []);
};

export const getJobSkills = (job) => {
  if (Array.isArray(job?.required_skills) && job.required_skills.length) {
    return normalizeSkillList(job.required_skills);
  }

  if (Array.isArray(job?.skills) && job.skills.length) {
    return normalizeSkillList(job.skills);
  }

  return [];
};

export const matchHasSelectedSkills = (matchedSkills, selectedSkills) => {
  const normalizedMatchedSkills = new Set(
    normalizeSkillList(matchedSkills).map((skill) => normalizeSkillValue(skill)),
  );

  return normalizeSkillList(selectedSkills).every((skill) =>
    normalizedMatchedSkills.has(normalizeSkillValue(skill)),
  );
};

export const parseCityLabel = (text) => {
  if (!text) return "Chưa rõ địa điểm";

  const parts = String(text)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.at(-1) || text;
};

export const parseExplanationLines = (text) =>
  String(text || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

export const unwrapApiPayload = (response) => {
  let current = response?.data;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return {};
    }

    if (Array.isArray(current.matches) || typeof current.total !== "undefined") {
      return current;
    }

    if (!("data" in current)) {
      return current;
    }

    current = current.data;
  }

  return current && typeof current === "object" && !Array.isArray(current) ? current : {};
};

export const getScoreTone = (value) => {
  const percent = Number(value || 0) * 100;

  if (percent >= 80) {
    return {
      label: "Xuất sắc",
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (percent >= 60) {
    return {
      label: "Khá phù hợp",
      bar: "bg-amber-400",
      text: "text-amber-700",
      chip: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (percent >= 40) {
    return {
      label: "Trung bình",
      bar: "bg-orange-400",
      text: "text-orange-700",
      chip: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "Chưa phù hợp",
    bar: "bg-rose-500",
    text: "text-rose-700",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
  };
};

export const sortJobs = (jobs, sortBy) => {
  const sorted = [...jobs];

  if (sortBy === "applications_desc") {
    sorted.sort(
      (a, b) => (b?._count?.applications || 0) - (a?._count?.applications || 0),
    );
    return sorted;
  }

  if (sortBy === "title_asc") {
    sorted.sort((a, b) => String(a?.title || "").localeCompare(String(b?.title || "")));
    return sorted;
  }

  sorted.sort(
    (a, b) =>
      new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime(),
  );
  return sorted;
};

export const sortMatches = (matches, sortBy) => {
  const sorted = [...matches];

  sorted.sort((a, b) => {
    const aValue = sortBy === "overall_score" ? a.overall_score : a.scores?.[sortBy] || 0;
    const bValue = sortBy === "overall_score" ? b.overall_score : b.scores?.[sortBy] || 0;

    if (bValue !== aValue) {
      return bValue - aValue;
    }

    return (a.rankOrder || 0) - (b.rankOrder || 0);
  });

  return sorted;
};

export const normalizeStatus = (value) => {
  if (!value) return "pending";
  return String(value).toLowerCase();
};

export const getMatchApplicationId = (match) => {
  const resolvedId = Number(match?.source_application_id ?? match?.application_id);
  return Number.isFinite(resolvedId) && resolvedId > 0 ? resolvedId : null;
};

export const getCvViewPath = (cv) => {
  if (!cv || cv.type !== "file" || !cv.file_public_id) return null;
  const filename = String(cv.file_public_id).replace(/^cvs\//, "");
  return `/cvs/view/${filename}`;
};

export const exportMatchesToCsv = ({ job, mode, matches }) => {
  const rows = matches.map((item, index) => ({
    rank: index + 1,
    candidate_name: item.displayName,
    source_candidate_id: item.source_candidate_id || item.candidate_id || "",
    overall_score: formatExactPercent(item.overall_score),
    semantic_score: formatExactPercent(item.scores?.semantic_score),
    skill_match_score: formatExactPercent(item.scores?.skill_match_score),
    experience_score: formatExactPercent(item.scores?.experience_score),
    location_score: formatExactPercent(item.scores?.location_score),
    salary_score: formatExactPercent(item.scores?.salary_score),
    matched_skills: (item.matched_skills || []).join(", "),
    missing_skills: (item.missing_skills || []).join(", "),
    status: item.applicationStatus || item.status || "",
    application_id: getMatchApplicationId(item) || "",
    mode: item.mode || mode,
  }));

  const headers = Object.keys(rows[0] || {
    rank: "",
    candidate_name: "",
    source_candidate_id: "",
    overall_score: "",
  });

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${job?.title || "matching"}-${mode}-${new Date().getTime()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
