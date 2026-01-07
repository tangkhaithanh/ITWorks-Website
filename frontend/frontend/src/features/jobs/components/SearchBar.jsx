import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { setKeyword, setCity } from "../jobSearchSlice";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import LocationAPI from "@/features/jobs/LocationAPI";
import JobAPI from "../JobAPI";
import { Search, MapPin, Loader2, X, History, Sparkles } from "lucide-react";

const SearchBar = ({ onSearch, size = "md", compact = false }) => {
  const dispatch = useDispatch();
  const { keyword, city } = useSelector((s) => s.jobSearch);
  const reduxKeyword = useSelector((s) => s.jobSearch.keyword);
  const reduxCity = useSelector((s) => s.jobSearch.city);

  const [localKeyword, setLocalKeyword] = useState(reduxKeyword);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Layout Config
  const isLarge = size === "lg";
  const containerHeight = compact ? "h-[50px]" : isLarge ? "h-[64px]" : "h-[56px]";
  const iconSize = isLarge ? "w-6 h-6" : "w-5 h-5";
  const fontSize = isLarge ? "text-lg" : "text-base";

  // --- Logic giữ nguyên ---
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const res = await LocationAPI.getCities();
        const data = res?.data?.data || [];
        setCities([
          { value: "", label: "Tất cả thành phố" },
          ...data.map((c) => ({ value: c.name, label: c.name })),
        ]);
      } catch (err) {
        console.error("Fetch cities error:", err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

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
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
  setLocalKeyword(reduxKeyword);
}, [reduxKeyword]);

  const handleSubmit = (e) => {
  e.preventDefault();
  setIsFocused(false);

  const kw = localKeyword.trim();

  dispatch(setKeyword(kw));
  dispatch(setCity(city));

  onSearch?.({
    keyword: kw,
    city,
  });
};


  const handleClearKeyword = () => {
    dispatch(setKeyword(""));
    setSuggestions([]);
  };

  return (
      <form
          onSubmit={handleSubmit}
          ref={wrapperRef}
          className={`
        relative z-50 flex items-center gap-1
        bg-white  /* ✅ QUAN TRỌNG: Nền trắng tuyệt đối 100%, không dùng /90 hay /95 */
        transition-all duration-300 ease-out
        ${
              isFocused
                  ? "ring-4 ring-blue-100 shadow-xl" // Khi focus: Glow xanh nhẹ
                  : "shadow-lg hover:shadow-xl border border-transparent" // Bình thường: Đổ bóng sâu để tách biệt nền
          }
        ${compact ? "rounded-full py-1 pl-1 pr-1.5" : "rounded-full p-2 pl-3"}
      `}
      >
        {/* ----------------------------------------------------------------
          KHỐI 1: TỪ KHÓA
      ------------------------------------------------------------------ */}
        <div className={`relative flex-1 group ${containerHeight} flex items-center ml-2`}>
          {/* Icon Search */}
          <div className={`
            flex items-center justify-center rounded-full transition-all duration-300
            ${isLarge ? "w-10 h-10" : "w-8 h-8"}
            ${isFocused ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-500"}
        `}>
            {loading ? (
                <Loader2 className={`${iconSize} animate-spin`} />
            ) : (
                <Search className={iconSize} />
            )}
          </div>

          {/* Input Field */}
          <input
              type="text"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={isLarge ? "Tìm công việc, kỹ năng, công ty..." : "Tìm việc làm..."}
              className={`
            w-full h-full pl-4 pr-10
            bg-transparent border-none outline-none 
            text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium
            ${fontSize}
          `}
          />

          {/* Nút Clear */}
          {keyword && (
              <button
                  type="button"
                  onClick={handleClearKeyword}
                  className="absolute right-2 p-1.5 text-slate-300 bg-transparent hover:bg-slate-100 hover:text-red-500 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
          )}

          {/* --- SUGGESTIONS DROPDOWN (Nền trắng tuyệt đối) --- */}
          {isFocused && (suggestions.length > 0 || loading) && (
              <div className="absolute top-[calc(100%+16px)] left-[-12px] w-[calc(100%+40px)] bg-white rounded-3xl shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[60]">
                <div className="px-6 py-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Gợi ý thông minh
                </div>

                <ul className="py-2">
                  {suggestions.map((item, i) => (
                      <li
                          key={i}
                          onClick={() => {
                            dispatch(setKeyword(item));
                            setIsFocused(false);
                          }}
                          className="flex items-center gap-4 px-6 py-3.5 cursor-pointer hover:bg-blue-50 transition-all group/item border-l-4 border-transparent hover:border-blue-500"
                      >
                        <div className="p-2 bg-slate-50 rounded-full group-hover/item:bg-blue-100 transition-colors">
                          <History className="w-4 h-4 text-slate-400 group-hover/item:text-blue-600" />
                        </div>
                        <span className="text-slate-600 font-medium group-hover/item:text-slate-900 group-hover/item:translate-x-1 transition-transform">
                    {item}
                  </span>
                      </li>
                  ))}
                </ul>
              </div>
          )}
        </div>

        {/* Divider: Màu xám cực nhạt để không làm bẩn nền trắng */}
        <div className="w-[1px] h-8 bg-gray-100 mx-2 hidden sm:block"></div>

        {/* ----------------------------------------------------------------
          KHỐI 2: THÀNH PHỐ
      ------------------------------------------------------------------ */}
        <div className="w-[160px] sm:w-[220px] relative z-40 group/city">
          <div className="relative px-2">
            <div className="flex items-center gap-2">
              <div className="text-gray-400 group-hover/city:text-blue-500 transition-colors">
                <MapPin className={iconSize} />
              </div>
              <SearchableDropdown
                  name="city"
                  value={city}
                  onChange={(e) => dispatch(setCity(e.target.value))}
                  options={cities}
                  placeholder={loadingCities ? "Đang tải..." : "Địa điểm"}
                  searchPlaceholder="Tìm tỉnh/thành..."
                  maxWidth="100%"
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------
          KHỐI 3: BUTTON SUBMIT
      ------------------------------------------------------------------ */}
        <div className="pl-2">
          <Button
              type="submit"
              size={compact ? "sm" : isLarge ? "lg" : "md"}
              className={`
            !rounded-full font-bold tracking-wide
            shadow-lg shadow-blue-500/30 
            hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300
            ${compact
                  ? '!w-10 !h-10 !p-0 flex items-center justify-center bg-blue-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8'
              }
            `}
          >
            {compact ? (
                <Search className="w-5 h-5 text-white" />
            ) : (
                <span className="flex items-center gap-2">
                    {isLarge && <Search className="w-5 h-5" />}
                  Tìm Kiếm
                </span>
            )}
          </Button>
        </div>
      </form>
  );
};

export default SearchBar;