// src/components/ui/TextInput.jsx

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

const TextInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
  size = "md",       // chiều cao
  width = "full",    // chiều ngang
  className = "",
  ...props
}) => {
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

      <div className={`relative group ${widths[width] || widths.full}`}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full border rounded-2xl transition-all duration-300 ease-out 
            bg-white/50 backdrop-blur-sm focus:bg-white focus:scale-[1.02] 
            outline-none placeholder-slate-400 text-slate-800 font-medium 
            shadow-sm hover:shadow-md
            ${error
              ? "border-rose-300 focus:ring-4 focus:ring-rose-100 focus:border-rose-400 shadow-rose-100"
              : "border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 hover:border-slate-300 group-hover:shadow-lg"}
            ${sizes[size]} ${className}`}
          {...props}
        />

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

export default TextInput;
