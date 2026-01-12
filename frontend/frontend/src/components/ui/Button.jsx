import clsx from "clsx";

const baseStyles =
  "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";

const variants = {
  primary:
    "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:brightness-110 focus:ring-blue-300",
  secondary:
    "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:brightness-105 focus:ring-gray-300",
  outline:
    "border-2 border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-gray-300 bg-white/80 backdrop-blur-sm",
  green:
    "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 focus:ring-green-300",
};

const sizes = {
  sm: "px-4 py-2 text-sm min-h-[36px]",
  md: "px-6 py-3 text-base min-h-[44px]",
  lg: "px-8 py-4 text-lg min-h-[52px]",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "relative group overflow-hidden", // 👈 thêm overflow-hidden
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Nội dung nút */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Shine effect */}
      <div
        className="absolute inset-0 rounded-2xl 
                   before:content-[''] before:absolute before:top-0 before:left-[-50%] 
                   before:w-[50%] before:h-full 
                   before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent 
                   before:transform before:skew-x-[-20deg] 
                   group-hover:before:animate-[shine_1s_forwards]"
      />
    </button>
  );
};

export default Button;
