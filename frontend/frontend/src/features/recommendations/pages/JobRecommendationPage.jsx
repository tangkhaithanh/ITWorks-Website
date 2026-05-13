import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RecommendationAPI from "../RecommendationAPI";
import RecommendationCard from "../components/RecommendationCard";

const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-gray-200" />
        <div>
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded mt-2" />
        </div>
      </div>
      <div className="h-8 w-12 bg-gray-200 rounded-full" />
    </div>
    <div className="h-3 w-64 bg-gray-200 rounded mt-4" />
    <div className="flex gap-2 mt-3">
      <div className="h-5 w-16 bg-gray-200 rounded-full" />
      <div className="h-5 w-16 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const JobRecommendationPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RecommendationAPI.getRecommendations();
      setRecommendations(res.data?.data?.matches || []);
    } catch (err) {
      setError(
        err?.response?.status === 503
          ? "Dịch vụ đề xuất tạm thời không khả dụng. Vui lòng thử lại sau."
          : "Không thể tải danh sách đề xuất. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleCardClick = (rec) => {
    navigate(`/jobs/${rec.job_id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đề xuất việc làm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Việc làm phù hợp với hồ sơ và kỹ năng của bạn
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">Chưa có đề xuất việc làm nào.</p>
          <p className="text-gray-400 text-sm mt-2">
            Hãy đảm bảo hồ sơ của bạn đầy đủ và kỹ năng được cập nhật.
          </p>
          <button
            onClick={fetchRecommendations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Làm mới
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id}>
              <RecommendationCard
                recommendation={rec}
                onClick={() => handleCardClick(rec)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobRecommendationPage;
