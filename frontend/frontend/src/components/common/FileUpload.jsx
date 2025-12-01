
import { useState, useRef} from "react";
export default function FileUpload({ label, accept, onFileChange, previewType = "image" }) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    onFileChange(file);

    if (previewType === "image") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleClear = () => {
    setFileName("");
    setPreviewUrl("");
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* CHỈ hiển thị khung upload nếu CHƯA chọn file */}
      {!fileName && (
        <label className="flex flex-col items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors">
          <span className="text-sm text-slate-600">Chọn file từ máy</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
        </label>
      )}

      {/* PREVIEW IMAGE */}
      {previewType === "image" && previewUrl && (
        <div className="mt-2 relative w-fit">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm"
          />

          {/* X */}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 bg-white border border-slate-300 text-slate-600 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow"
          >
            ×
          </button>

          <p className="mt-1 text-xs text-slate-500 truncate max-w-[150px]">
            {fileName}
          </p>
        </div>
      )}

      {/* PREVIEW FILE PDF */}
      {previewType === "file" && fileName && (
        <div className="mt-2 relative flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 w-fit">
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 3h10a1 1 0 011 1v16l-6-3-6 3V4a1 1 0 011-1z"
            />
          </svg>

          <span className="text-xs text-slate-700 truncate">{fileName}</span>

          {/* X */}
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 bg-white border border-slate-300 text-slate-600 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}