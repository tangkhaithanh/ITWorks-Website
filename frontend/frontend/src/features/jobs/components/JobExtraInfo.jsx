import {
  AlertTriangle,
  MapPin,
  Users,
  Briefcase,
  ClipboardList,
  FileBadge,
} from "lucide-react";

const getSkillList = (job, fieldName) => {
  if (Array.isArray(job?.[fieldName])) {
    return job[fieldName];
  }

  if (fieldName === "required_skills" && Array.isArray(job?.skills)) {
    return job.skills;
  }

  return [];
};

const renderSkillTags = (skills, emptyLabel, tagClassName) => {
  if (!skills.length) {
    return <span className="text-slate-500 text-sm">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {skills.map((skill, index) => (
        <span key={`${skill}-${index}`} className={tagClassName}>
          {skill}
        </span>
      ))}
    </div>
  );
};

const JobExtraInfo = ({ job, onReport }) => {
  if (!job) return null;

  const workModes = Array.isArray(job.work_modes)
    ? job.work_modes
        .map(
          (mode) =>
            (
              {
                onsite: "Làm việc tại văn phòng",
                remote: "Làm việc từ xa",
                hybrid: "Hybrid",
              }[mode] || mode
            )
        )
        .join(", ")
    : "Khong ro";

  const employmentTypeMap = {
    fulltime: "Toàn thời gian",
    parttime: "Bán thời gian",
    intern: "Thực tập",
    contract: "Hợp đồng ngắn hạn",
  };

  const requiredSkills = getSkillList(job, "required_skills");
  const niceToHaveSkills = getSkillList(job, "nice_to_have_skills");

  // ── Kinh nghiệm: null/undefined → ẩn hoàn toàn
  const hasExperience =
    job.experience_required !== null && job.experience_required !== undefined;
  const experienceValue = hasExperience
    ? `${job.experience_required} năm`
    : null;

  // ── Skills: mảng rỗng → ẩn hoàn toàn
  const hasRequiredSkills = requiredSkills.length > 0;
  const hasNiceToHaveSkills = niceToHaveSkills.length > 0;

  const infoItems = [
    {
      label: "Địa điểm làm việc",
      value: job.location?.full || job.location_full || "Không rõ",
      icon: MapPin,
      show: true,
    },
    {
      label: "Số lượng tuyển",
      value: job.number_of_openings || "1",
      icon: Users,
      show: true,
    },
    {
      label: "Hình thức làm việc",
      value: workModes,
      icon: Briefcase,
      show: true,
    },
    {
      label: "Loại công việc",
      value: employmentTypeMap[job.employment_type] || "Không xác định",
      icon: FileBadge,
      show: true,
    },
    {
      label: "Kinh nghiệm tối thiểu",
      value: experienceValue,
      icon: ClipboardList,
      show: hasExperience,
    },
    {
      label: "Kỹ năng bắt buộc",
      value: hasRequiredSkills
        ? renderSkillTags(
            requiredSkills,
            "",
            "px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
          )
        : null,
      icon: ClipboardList,
      show: hasRequiredSkills,
    },
    {
      label: "Kỹ năng ưu tiên",
      value: hasNiceToHaveSkills
        ? renderSkillTags(
            niceToHaveSkills,
            "",
            "px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
          )
        : null,
      icon: ClipboardList,
      show: hasNiceToHaveSkills,
    },
  ];

  // Chỉ render những item có show: true
  const visibleItems = infoItems.filter((item) => item.show);

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">
        Thông tin chung
      </h3>

      <div className="space-y-4">
        {visibleItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
              <Icon size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <div className="text-sm font-medium text-slate-800 leading-relaxed">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onReport}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <AlertTriangle className="h-4 w-4" />
          Báo cáo tin
        </button>
      </div>
    </div>
  );
};

export default JobExtraInfo;
