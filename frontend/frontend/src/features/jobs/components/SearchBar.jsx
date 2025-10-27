import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setKeyword, setCity } from "../jobSearchSlice";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import JobAPI from "../JobAPI";

const SearchBar = ({ onSearch, size = "md" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { keyword, city } = useSelector((s) => s.jobSearch);

  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const inputSize =
    size === "lg"
      ? "p-6 text-lg rounded-3xl shadow-xl"
      : "p-4 text-base rounded-2xl shadow-md";

  // 🧠 debounce suggest
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const query = keyword.trim();
      if (!query) return setSuggestions([]);

      try {
        setLoading(true);
        const res = await JobAPI.suggest(query);
        const result = res?.data?.data;
        setSuggestions(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Suggest error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [keyword]);

  // 🔒 Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚀 Khi click 1 gợi ý hoặc bấm nút tìm kiếm → chuyển sang trang search
  const goToSearchPage = (kw, ct) => {
    const params = new URLSearchParams();
    if (kw) params.set("keyword", kw);
    if (ct) params.set("city", ct);
    navigate(`/jobs/search?${params.toString()}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsFocused(false);
    goToSearchPage(keyword, city);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative z-50 flex flex-wrap items-center gap-3 
             bg-white/95 backdrop-blur-sm border border-white/40
             px-4 py-3 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.25)]
             ${size === "lg" ? "shadow-2xl" : "shadow-md"}`}
      ref={wrapperRef}
    >
      {/* Ô nhập từ khóa */}
      <div className="relative flex-1 min-w-[240px]">
        <TextInput
          value={keyword}
          onChange={(e) => dispatch(setKeyword(e.target.value))}
          placeholder="Tìm việc làm (VD: ReactJS, NodeJS...)"
          className={inputSize}
          onFocus={() => setIsFocused(true)}
        />

        {/* 🔍 Gợi ý giống Google */}
        {isFocused && (
          <ul className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {loading && (
              <li className="px-4 py-3 text-sm text-slate-500 italic">
                Đang gợi ý...
              </li>
            )}

            {!loading &&
              suggestions.map((item, i) => (
                <li
                  key={i}
                  onClick={() => {
                    dispatch(setKeyword(item));
                    setIsFocused(false);
                    goToSearchPage(item, city); // ✅ chuyển trang ngay khi click gợi ý
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                    />
                  </svg>
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}

            {!loading && suggestions.length === 0 && keyword.trim() && (
              <li className="px-4 py-3 text-sm text-slate-500 italic">
                Không có gợi ý phù hợp
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Ô chọn thành phố */}
      <div className="w-[200px]">
        <SelectInput
          value={city}
          onChange={(e) => dispatch(setCity(e.target.value))}
          options={[
            { value: "", label: "Tất cả thành phố" },
            { value: "TP.HCM", label: "TP.HCM" },
            { value: "Hà Nội", label: "Hà Nội" },
            { value: "Đà Nẵng", label: "Đà Nẵng" },
          ]}
        />
      </div>

      <Button type="submit" size={size === "lg" ? "lg" : "md"}>
        Tìm kiếm
      </Button>
    </form>
  );
};

export default SearchBar;
