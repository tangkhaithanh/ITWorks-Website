// src/components/common/InfoRow.jsx

export default function InfoRow({ 
  label, 
  value, 
  isLink = false, 
  isEmail = false, 
  className = "" 
}) {
  // Logic hiển thị: Nếu không có value thì hiện gạch ngang
  const isEmpty = !value;
  const display = value || "—";

  // Base styles cho text
  const baseValueClass = "text-sm font-medium break-words transition-colors duration-200";

  let renderedValue;

  if (isEmpty) {
    // Style cho trạng thái rỗng (nhạt hơn để không gây chú ý)
    renderedValue = (
      <p className={`${baseValueClass} text-slate-400 italic`}>
        {display}
      </p>
    );
  } else if (isLink) {
    // Style cho Link: Xanh, gạch chân cách xa chữ 1 chút cho thoáng
    renderedValue = (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          ${baseValueClass} 
          text-blue-600 hover:text-blue-800 
          underline decoration-blue-200 hover:decoration-blue-800 underline-offset-2
        `}
      >
        {display}
      </a>
    );
  } else if (isEmail) {
    // Style cho Email: Tương tự link nhưng có thể thêm logic hover khác nếu muốn
    renderedValue = (
      <a
        href={`mailto:${value}`}
        className={`
          ${baseValueClass} 
          text-slate-900 hover:text-blue-600 
          hover:underline decoration-blue-300 underline-offset-2
        `}
      >
        {display}
      </a>
    );
  } else {
    // Style cho Text thường: Màu đậm, rõ ràng
    renderedValue = (
      <p className={`${baseValueClass} text-slate-900 leading-relaxed`}>
        {display}
      </p>
    );
  }

  return (
    <div className={`group flex flex-col gap-1 ${className}`}>
      {/* Label: Tinh chỉnh nhỏ, viết hoa, màu nhạt */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
      
      {/* Value */}
      <div className="min-h-[20px]">
        {renderedValue}
      </div>
    </div>
  );
}