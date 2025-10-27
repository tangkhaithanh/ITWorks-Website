// src/features/jobs/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "../features/jobs/components/SearchBar";
import { useSelector } from "react-redux";

const HomePage = () => {
  const navigate = useNavigate();
  const { keyword, city } = useSelector((s) => s.jobSearch);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);

    navigate(`/jobs/search?${params.toString()}`);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">
        Tìm việc làm IT tốt nhất hôm nay 👨‍💻
      </h1>
      <p className="text-slate-600 mb-10">
        Hàng nghìn công việc chất lượng đang chờ bạn.
      </p>

      <div className="max-w-3xl mx-auto">
        <SearchBar onSearch={handleSearch} size="lg" />
      </div>
    </main>
  );
};

export default HomePage;
