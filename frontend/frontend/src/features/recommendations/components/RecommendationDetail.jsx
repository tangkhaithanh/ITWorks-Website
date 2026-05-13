import ScoreBadge from "./ScoreBadge";

const ScoreRow = ({ label, score }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-600">{label}</span>
    <ScoreBadge score={score} label={label} />
  </div>
);

const RecommendationDetail = ({ recommendation, onClose }) => {
  const {
    overall_score,
    semantic_score,
    skill_match_score,
    experience_score,
    location_score,
    salary_score,
    matched_skills,
    missing_skills,
    explanation,
  } = recommendation;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-2 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Chi tiết đánh giá
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Đóng
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">Tổng quan</span>
          <ScoreBadge score={overall_score} label="Điểm tổng quan" size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-x-6">
          <ScoreRow label="Ngữ nghĩa" score={semantic_score} />
          <ScoreRow label="Kỹ năng" score={skill_match_score} />
          <ScoreRow label="Kinh nghiệm" score={experience_score} />
          <ScoreRow label="Địa điểm" score={location_score} />
          <ScoreRow label="Lương" score={salary_score} />
        </div>

        {matched_skills?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Kỹ năng phù hợp</p>
            <div className="flex flex-wrap gap-1.5">
              {matched_skills.map((skill) => (
                <span key={skill} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missing_skills?.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Kỹ năng còn thiếu</p>
            <div className="flex flex-wrap gap-1.5">
              {missing_skills.map((skill) => (
                <span key={skill} className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {explanation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationDetail;
