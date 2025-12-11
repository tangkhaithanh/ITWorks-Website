import { useEffect, useMemo, useState, useCallback } from "react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import JobCategoryAPI from "@/features/jobCategories/JobCategoryAPI";
import SkillAPI from "@/features/skills/SkillAPI";
import {
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Zap,
  Layers
} from "lucide-react";

// --- Sub Components ---

const FilterSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-0 py-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 group transition-colors hover:bg-slate-50 rounded-lg"
      >
        <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-sm">
          {Icon && (
            <Icon
              size={16}
              className="text-slate-400 group-hover:text-blue-500 transition-colors"
            />
          )}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {/* Vấn đề cũ nằm ở đây: overflow-hidden sẽ cắt mất dropdown nếu nó nằm trong này */}
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 mb-3" : "max-h-0 opacity-0 overflow-hidden"
          }`}
      >
        <div className="pt-1 px-1">{children}</div>
      </div>
    </div>
  );
};

const FilterChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 select-none
      ${active
        ? "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-200 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
  >
    {label}
  </button>
);

// --- Main Component ---
const FilterSidebar = ({ onApply, onReset }) => {
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [workModes, setWorkModes] = useState([]);
  const [experience, setExperience] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [category, setCategory] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [categories, setCategories] = useState([]);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [skills, setSkills] = useState([]);

  const workModeOptions = [
    { value: "onsite", label: "Onsite" },
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
  ];
  const expOptions = [
    { value: "fresher", label: "Fresher" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Middle" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Leader" },
    { value: "intern", label: "Intern" },
  ];
  const employmentOptions = [
    { value: "fulltime", label: "Full-time" },
    { value: "parttime", label: "Part-time" },
    { value: "contract", label: "Contract" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, skillRes] = await Promise.all([
          JobCategoryAPI.getAll(),
          SkillAPI.getAll(),
        ]);
        setCategories(catRes.data?.data || []);
        setSkillsOptions(skillRes.data?.data?.map((s) => s.name) || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu filter:", err);
      }
    };
    fetchData();
  }, []);

  const collectFilters = () => ({
    min_salary: minSalary ? Number(minSalary) : undefined,
    max_salary: maxSalary ? Number(maxSalary) : undefined,
    work_modes: workModes.length ? workModes : undefined,
    experience_levels: experience.length ? experience : undefined,
    employment_type: employmentTypes.length ? employmentTypes : undefined,
    skills: skills.length ? skills : undefined,
    category: category || undefined,
    negotiable: negotiable ? true : undefined,
  });

  const debounce = (fn, delay = 400) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedApply = useCallback(
    debounce((filters) => {
      onApply?.(filters);
    }, 500),
    [onApply]
  );

  const handleApplyNow = () => onApply?.({ ...collectFilters(), page: 1 });

  const toggleChip = (arr, setArr, value, key) => {
    const newArr = arr.includes(value)
      ? arr.filter((x) => x !== value)
      : [...arr, value];
    setArr(newArr);
    debouncedApply({ ...collectFilters(), [key]: newArr, page: 1 });
  };

  const toggleSkill = (skill) => {
    const newArr = skills.includes(skill)
      ? skills.filter((s) => s !== skill)
      : [...skills, skill];
    setSkills(newArr);
    debouncedApply({ ...collectFilters(), skills: newArr, page: 1 });
  };

  const handleClear = () => {
    setMinSalary("");
    setMaxSalary("");
    setWorkModes([]);
    setExperience([]);
    setEmploymentTypes([]);
    setSkills([]);
    setCategory("");
    setNegotiable(false);
    onReset?.();
  };

  const activeCount = useMemo(() => {
    let count = 0;
    if (minSalary || maxSalary) count++;
    if (workModes.length) count++;
    if (experience.length) count++;
    if (employmentTypes.length) count++;
    if (skills.length) count++;
    if (category) count++;
    if (negotiable) count++;
    return count;
  }, [
    minSalary,
    maxSalary,
    workModes,
    experience,
    employmentTypes,
    skills,
    category,
    negotiable,
  ]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Filter
            size={20}
            className="text-blue-600"
            fill="currentColor"
            fillOpacity={0.1}
          />
          <span>Bộ lọc</span>
        </div>

        <button
          onClick={handleClear}
          disabled={activeCount === 0}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded transition-colors
            ${activeCount > 0
              ? "text-red-500 hover:bg-red-50 cursor-pointer"
              : "text-slate-300 cursor-not-allowed"
            }`}
        >
          <RotateCcw size={12} />
          Xóa ({activeCount})
        </button>
      </div>

      {/* ✅ FIXED: Phần Ngành Nghề
         - Loại bỏ FilterSection để tránh overflow-hidden.
         - Thêm z-index: 50 để dropdown đè lên phần scroll bên dưới.
      */}
      <div className="px-5 pt-3 pb-3 border-b border-slate-100 relative z-50">
        <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-sm mb-2">
          <Layers size={16} className="text-slate-400" />
          <span>Ngành nghề</span>
        </div>
        <div className="relative">
          <SelectInput
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              debouncedApply({
                ...collectFilters(),
                category: e.target.value,
                page: 1,
              });
            }}
            options={[
              { value: "", label: "Tất cả ngành nghề" },
              ...categories.map((c) => ({
                value: c.name,
                label: c.name,
              })),
            ]}
            className="w-full text-sm py-2"
          />
        </div>
      </div>

      {/* 3. Các filter còn lại CUỘN RIÊNG */}
      {/* Thêm relative z-0 để chắc chắn nó nằm dưới phần Ngành nghề */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 custom-scrollbar space-y-1 relative z-0">

        {/* --- Section: Mức lương --- */}
        <FilterSection
          title="Mức lương (Triệu VNĐ)"
          icon={DollarSign}
          defaultOpen={true}
        >
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 group">
                <input
                  type="number"
                  placeholder="Min"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm text-center"
                />
              </div>
              <span className="text-slate-400 font-light">–</span>
              <div className="relative flex-1 group">
                <input
                  type="number"
                  placeholder="Max"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 
                  ${negotiable
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-slate-300 hover:border-blue-400"
                    }`}
                >
                  {negotiable && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={negotiable}
                  onChange={(e) => {
                    setNegotiable(e.target.checked);
                    debouncedApply({
                      ...collectFilters(),
                      negotiable: e.target.checked,
                      page: 1,
                    });
                  }}
                />
                <span className="text-xs font-medium text-slate-600">
                  Thương lượng
                </span>
              </label>

              {(minSalary || maxSalary) && (
                <button
                  onClick={handleApplyNow}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Áp dụng
                </button>
              )}
            </div>
          </div>
        </FilterSection>

        {/* --- Section: Hình thức làm việc --- */}
        <FilterSection title="Hình thức" icon={MapPin} defaultOpen={true}>
          <div className="flex flex-wrap gap-2">
            {workModeOptions.map((o) => (
              <FilterChip
                key={o.value}
                label={o.label}
                active={workModes.includes(o.value)}
                onClick={() =>
                  toggleChip(workModes, setWorkModes, o.value, "work_modes")
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* --- Section: Kinh nghiệm --- */}
        <FilterSection
          title="Kinh nghiệm"
          icon={Briefcase}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {expOptions.map((o) => (
              <FilterChip
                key={o.value}
                label={o.label}
                active={experience.includes(o.value)}
                onClick={() =>
                  toggleChip(
                    experience,
                    setExperience,
                    o.value,
                    "experience_levels"
                  )
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* --- Section: Loại hợp đồng --- */}
        <FilterSection
          title="Loại hợp đồng"
          icon={Clock}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {employmentOptions.map((o) => (
              <FilterChip
                key={o.value}
                label={o.label}
                active={employmentTypes.includes(o.value)}
                onClick={() =>
                  toggleChip(
                    employmentTypes,
                    setEmploymentTypes,
                    o.value,
                    "employment_type"
                  )
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* --- Section: Kỹ năng --- */}
        <FilterSection
          title="Kỹ năng chuyên môn"
          icon={Zap}
          defaultOpen={true}
        >
          <div className="max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {skillsOptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Đang tải kỹ năng...
              </p>
            ) : (
              <div className="space-y-1">
                {skillsOptions.map((skill) => (
                  <label
                    key={skill}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 group
                      ${skills.includes(skill)
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 
                      ${skills.includes(skill)
                          ? "bg-blue-600 border-blue-600 shadow-sm"
                          : "bg-white border-slate-300 group-hover:border-blue-400"
                        }`}
                    >
                      {skills.includes(skill) && (
                        <Check
                          size={12}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={skills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                    />
                    <span
                      className={`text-sm ${skills.includes(skill)
                        ? "text-blue-700 font-medium"
                        : "text-slate-600"
                        }`}
                    >
                      {skill}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </FilterSection>
      </div>

      {/* 4. Footer */}
      <div className="p-4 text-center border-t border-slate-50">
        <p className="text-[10px] text-slate-400">
          Được lọc thông minh bởi JobSystem
        </p>
      </div>
    </div>
  );
};

export default FilterSidebar;