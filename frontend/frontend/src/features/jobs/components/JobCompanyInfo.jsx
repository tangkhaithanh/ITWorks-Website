import { ArrowUpRight, Users, Layers, MapPin } from "lucide-react";

const JobCompanyInfo = ({ company, job }) => {
  if (!company) return null;

  const infoItems = [
    { label: "Quy mô", value: job?.size || "Không rõ", icon: Users },
    {
      label: "Lĩnh vực",
      value: company.industries?.join(", ") || "Chưa cập nhật",
      icon: Layers,
    },
    {
      label: "Địa điểm",
      value: company.address || "Không rõ",
      icon: MapPin,
    },
  ];

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      {/* Logo + Tên công ty */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
          <img
            src={company.logo_url}
            alt={company.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-base font-bold text-slate-800 leading-snug">
          {company.name}
        </h3>
      </div>

      {/* Thông tin chi tiết */}
      <div className="space-y-2">
        {infoItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center text-sm text-slate-700">
            <Icon size={16} className="text-slate-500 mr-2 flex-shrink-0" />
            <span className="text-slate-500 min-w-[70px]">{label}:</span>
            <span className="font-medium truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Nút xem trang công ty */}
      <div className="mt-5 flex justify-center items-center">
        <a
          href={company.company_website || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          Xem trang công ty <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
};

export default JobCompanyInfo;
