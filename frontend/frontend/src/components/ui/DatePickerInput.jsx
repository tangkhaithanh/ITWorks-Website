import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DatePickerInput = ({
  label,
  name,
  value,
  onChange,
  required,
  error,
  className = "",
  placeholderText,
  minDate,
  maxDate,
}) => {

  // State để kiểm soát DatePicker
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + "T00:00:00") : null
  );

  // Khi props.value thay đổi → đồng bộ vào DatePicker
  useEffect(() => {
    setSelectedDate(value ? new Date(value + "T00:00:00") : null);
  }, [value]);

  const handleChange = (date) => {
    setSelectedDate(date);
    const formatted = date
  ? date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0")
  : "";
    onChange({ target: { name, value: formatted } });
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholderText}
          className={`w-full px-3 py-2.5 border rounded-2xl transition-all duration-300 ease-out bg-white/50 backdrop-blur-sm focus:bg-white focus:scale-[1.02] outline-none placeholder-slate-400 text-slate-800 font-medium shadow-sm hover:shadow-md ${
            error
              ? "border-rose-300 focus:ring-4 focus:ring-rose-100 focus:border-rose-400 shadow-rose-100"
              : "border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 hover:border-slate-300 group-hover:shadow-lg"
          } ${className}`}
          required={required}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          calendarClassName="custom-datepicker"
          wrapperClassName="w-full"
          minDate={minDate || null}
          maxDate={maxDate || null}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
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

export default DatePickerInput;
