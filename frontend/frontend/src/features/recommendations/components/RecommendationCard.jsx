import { ExternalLink } from "lucide-react";
import ScoreBadge from "./ScoreBadge";

const RecommendationCard = ({ recommendation, onClick }) => {
  const {
    job_title,
    company_name,
    company_logo,
    location_city,
    overall_score,
    salary_range,
    matched_skills,
    missing_skills,
    applied,
    saved,
  } = recommendation;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {company_logo ? (
              <img
                src={company_logo}
                alt={company_name}
                className="w-12 h-12 rounded-md object-contain border shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                {company_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="min-w-0">
              <button
                onClick={onClick}
                className="text-base font-semibold text-gray-900 hover:text-blue-600 text-left flex items-center gap-1"
              >
                {job_title}
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </button>
              <p className="text-sm text-gray-600">{company_name}</p>
              {location_city && (
                <p className="text-xs text-gray-400">{location_city}</p>
              )}
            </div>
          </div>
          <ScoreBadge score={overall_score} label="Điểm phù hợp" />
        </div>

        {salary_range?.min != null && (
          <p className="text-sm text-gray-500 mt-2">
            Mức lương: {salary_range.min?.toLocaleString()} - {salary_range.max?.toLocaleString()} triệu
          </p>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          {matched_skills?.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {skill}
            </span>
          ))}
          {matched_skills?.length > 4 && (
            <span className="text-xs text-gray-400">+{matched_skills.length - 4}</span>
          )}
          {missing_skills?.slice(0, 2).map((skill) => (
            <span key={skill} className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 line-through">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          {applied && (
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">Đã ứng tuyển</span>
          )}
          {saved && (
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Đã lưu</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
