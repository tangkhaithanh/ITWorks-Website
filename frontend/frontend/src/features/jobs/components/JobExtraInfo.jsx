import { MapPin, Users, Briefcase, ClipboardList, FileBadge } from "lucide-react";

const JobExtraInfo = ({ job }) => {
  if (!job) return null;

  // 🌐 Hiển thị hình thức làm việc
  const workModes = Array.isArray(job.work_modes)
    ? job.work_modes
        .map(
          (mode) =>
            (
              {
                onsite: "Làm việc tại văn phòng",
                remote: "Làm việc từ xa",
                hybrid: "Kết hợp (Hybrid)",
              }[mode] || mode
            )
        )
        .join(", ")
    : "Không rõ";

  // 🧾 Dịch loại công việc (employment type)
  const employmentTypeMap = {
    fulltime: "Toàn thời gian",
    parttime: "Bán thời gian",
    intern: "Thực tập",
    contract: "Hợp đồng ngắn hạn",
  };
  const employmentTypeLabel =
    employmentTypeMap[job.employment_type] || "Không xác định";

  // 🧠 Cấu hình các mục hiển thị
  const infoItems = [
    { label: "Địa chỉ làm việc", value: job.location.full || "Không rõ", icon: MapPin },
    { label: "Số lượng tuyển", value: job.number_of_openings || "1", icon: Users },
    { label: "Hình thức làm việc", value: workModes, icon: Briefcase },
    { label: "Loại công việc", value: employmentTypeLabel, icon: FileBadge },
    {
      label: "Yêu cầu kỹ năng",
      value: (
        <div className="flex flex-wrap gap-2 mt-1">
          {Array.isArray(job.skills) && job.skills.length > 0 ? (
            job.skills.map((s, idx) => {
              const name = typeof s === "string" ? s : s.skill?.name || s.name || "";
              return (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-200 hover:-translate-y-[1px] transition-all duration-200"
                >
                  {name}
                </span>
              );
            })
          ) : (
            <span className="text-slate-500 text-sm">Không yêu cầu</span>
          )}
        </div>
      ),
      icon: ClipboardList,
    },
  ];

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">
        Thông tin chung
      </h3>

      <div className="space-y-4">
        {infoItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
              <Icon size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <div className="text-sm font-medium text-slate-800 leading-relaxed">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobExtraInfo;
