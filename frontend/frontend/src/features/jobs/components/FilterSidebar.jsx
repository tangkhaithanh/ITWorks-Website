import { useEffect, useMemo, useState, useCallback } from "react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import JobCategoryAPI from "@/features/jobCategories/JobCategoryAPI";
import SkillAPI from "@/features/skills/SkillAPI";
const workModeOptions = [
  { value: "onsite", label: "Onsite" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const expOptions = [
  { value: "fresher", label: "Fresher" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "intern", label: "Intern" },
];

const employmentOptions = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "intern", label: "Intern" },
  { value: "contract", label: "Contract" },
];

const Chip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition
      ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
  >
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div className="p-4 border-b border-slate-100">
    <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
    {children}
  </div>
);

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
  const [skills, setSkills] = useState([]); // chỉ skill được chọn

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
    experience_levels: experience.length ? experience : undefined, // ✅ Đúng key backend
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

  const debouncedApply = useCallback(debounce((filters) => {
    onApply?.(filters);
  }, 400), [onApply]);

  const toggleChip = (arr, setArr, value, key) => {
    const newArr = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
    setArr(newArr);
    // ép giá trị mới vào payload để không phụ thuộc setState async
    debouncedApply({ ...collectFilters(), [key]: newArr, page: 1 });
};
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    debouncedApply({ ...collectFilters(), category: e.target.value, page: 1 });
  };

  const handleNegotiableChange = (e) => {
    setNegotiable(e.target.checked);
    debouncedApply({ ...collectFilters(), negotiable: e.target.checked, page: 1 });
  };


  const toggleCheckbox = (arr, setArr, value) => {
    const newArr = arr.includes(value)
      ? arr.filter((x) => x !== value)
      : [...arr, value];
    setArr(newArr);
    debouncedApply({ ...collectFilters(), skills: newArr, page: 1 });
  };

  
  // 🧮 Đếm số lượng filter đang chọn
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
  }, [minSalary, maxSalary, workModes, experience, employmentTypes, skills, category, negotiable]);



  const handleApply = () => {
  onApply?.({ ...collectFilters(), page: 1 });
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

  return (
    <div className="divide-y divide-slate-100 relative pb-20">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-semibold text-slate-800">Bộ lọc</h3>
      </div>

      {/* 💰 Mức lương */}
      <Section title="Mức lương (triệu)">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            type="number"
            placeholder="Tối thiểu"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
          />
          <TextInput
            type="number"
            placeholder="Tối đa"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
          />
        </div>

        {/* 🔵 Nút áp dụng lọc cho salary */}
        <div className="mt-3 text-center">
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Áp dụng
          </button>
        </div>
  </Section>

      {/* 💼 Hình thức làm việc */}
      <Section title="Hình thức làm việc">
        <div className="flex flex-wrap gap-2">
          {workModeOptions.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={workModes.includes(o.value)}
              onClick={() => toggleChip(workModes, setWorkModes, o.value,'work_modes')}
            />
          ))}
        </div>
      </Section>

      {/* 🧠 Cấp độ kinh nghiệm */}
      <Section title="Cấp độ kinh nghiệm">
        <div className="flex flex-wrap gap-2">
          {expOptions.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={experience.includes(o.value)}
              onClick={() => toggleChip(experience, setExperience, o.value, 'experience_levels')}
            />
          ))}
        </div>
      </Section>

      {/* 🕓 Loại hình công việc */}
      <Section title="Loại hình công việc">
        <div className="flex flex-wrap gap-2">
          {employmentOptions.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={employmentTypes.includes(o.value)}
              onClick={() => toggleChip(employmentTypes, setEmploymentTypes, o.value,'employment_type')}
            />
          ))}
        </div>
      </Section>

      {/* 🧩 Kỹ năng */}
      <Section title="Kỹ năng">
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {skillsOptions.map((skill) => (
        <label key={skill} className="flex items-center gap-2 text-sm">
            <input
            type="checkbox"
            checked={skills.includes(skill)}
            onChange={() => toggleCheckbox(skills, setSkills, skill)}
            className="w-4 h-4 accent-blue-600"
            />
            {skill}
        </label>
    ))}
        </div>
      </Section>

      {/* 🧭 Danh mục nghề nghiệp */}
      <Section title="Danh mục nghề nghiệp">
        <SelectInput
          value={category}
          onChange={handleCategoryChange}
          options={[
            { value: "", label: "Tất cả" },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />
      </Section>

      {/* 💬 Có thể thương lượng */}
      <Section title="Thương lượng">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={negotiable}
            onChange={handleNegotiableChange}
            className="w-4 h-4 accent-blue-600"
          />
          Có thể thương lượng
        </label>
      </Section>

      {/* ⚙️ Nút xóa lọc cố định ở cuối */}
      <div className="py-6 text-center">
        <button
          disabled={activeCount === 0}
          onClick={handleClear}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition
            ${
              activeCount === 0
                ? "text-slate-400 cursor-not-allowed bg-slate-50 border border-slate-100"
                : "text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
            }`}
        >
          {activeCount === 0 ? "Xóa lọc" : `Xóa lọc (${activeCount})`}
        </button>
    </div>
    </div>
  );
};

export default FilterSidebar;
