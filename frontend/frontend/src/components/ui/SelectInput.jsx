// src/components/ui/SelectInput.jsx
import { useState, useRef, useEffect } from "react";

const sizes = {
  sm: "px-3 py-2 text-sm min-h-[36px]",
  md: "px-4 py-2.5 text-base min-h-[44px]",
  lg: "px-5 py-3 text-lg min-h-[52px]",
};

const widths = {
  full: "w-full",    // 100% (mặc định)
  auto: "w-auto",    // co theo nội dung
  "1/2": "w-1/2",    // 50%
  "1/3": "w-1/3",    // 33%
  "2/3": "w-2/3",    // 66%
  "1/4": "w-1/4",    // 25%
  "64": "w-64",      // fixed 16rem (~256px)
};

const SelectInput = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "-- Chọn --",
  required,
  error,
  size = "md",       // chiều cao
  width = "full",    // chiều ngang
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find((opt) => opt.value === value) || null
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onChange({ target: { name, value: option.value } });
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group" ref={dropdownRef}>
        {/* Hidden select cho form submission */}
        <select
          name={name}
          value={value}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom select button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizes[size]} 
            ${widths[width]} 
            pr-10 border rounded-2xl transition-all duration-300 ease-out 
            bg-white/50 backdrop-blur-sm 
            hover:bg-white focus:bg-white focus:scale-[1.02] 
            outline-none text-left font-medium shadow-sm hover:shadow-md
            ${
              error
                ? "border-rose-300 focus:ring-4 focus:ring-rose-100 focus:border-rose-400 shadow-rose-100"
                : "border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 hover:border-slate-300 group-hover:shadow-lg"
            }
            ${className}
          `}
        >
          <span
            className={
              selectedOption ? "text-slate-800" : "text-slate-400"
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 transition-all duration-300 ${
              error
                ? "text-rose-400"
                : "text-slate-400 group-hover:text-slate-600 group-focus-within:text-blue-500"
            } ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-auto animate-in slide-in-from-top-2 duration-200">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-200 font-medium ${
                  index === 0 ? "rounded-t-2xl" : ""
                } ${
                  index === options.length - 1 ? "rounded-b-2xl" : ""
                } ${
                  option.value === value
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Gradient border effect */}
        <div
          className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none ${
            error
              ? "bg-gradient-to-r from-rose-400 to-pink-400"
              : "bg-gradient-to-r from-blue-400 to-purple-400"
          } group-focus-within:opacity-20 blur-sm -z-10`}
        />
      </div>

      {error && (
        <div className="flex items-start space-x-2 mt-2 animate-in slide-in-from-left-2 duration-200">
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
            <svg
              className="w-2.5 h-2.5 text-rose-600"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
          </div>
          <p className="text-sm text-rose-600 font-medium leading-tight">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectInput;
