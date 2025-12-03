import { useEffect, useState } from "react";
import { X, Download, ExternalLink, User } from "lucide-react";

const AvatarPreviewModal = ({ open, onClose, imageUrl, fullName }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state mỗi khi mở modal
  useEffect(() => {
    if (open) setIsLoaded(false);
  }, [open]);

  // Xử lý sự kiện nhấn phím ESC để đóng
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Khóa scroll body khi mở modal
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  // Hàm tải ảnh xuống
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `avatar-${fullName || "user"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      // Fallback mở tab mới nếu lỗi
      window.open(imageUrl, "_blank");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Nút đóng góc phải màn hình (Dành cho Desktop) */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
      >
        <X size={24} />
      </button>

      {/* Container chính */}
      <div
        className="relative flex flex-col items-center justify-center w-full h-full p-4"
        onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua ảnh để đóng
      >
        {/* Vùng hiển thị ảnh */}
        <div className="relative max-w-4xl w-full max-h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
          {/* Spinner loading nếu ảnh nặng */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
          
          <img
            src={imageUrl}
            alt={fullName || "Avatar Preview"}
            onLoad={() => setIsLoaded(true)}
            className={`
              max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl select-none transition-opacity duration-300
              ${isLoaded ? "opacity-100" : "opacity-0"}
            `}
          />
        </div>

        {/* Thanh thông tin & Công cụ (Toolbar) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl text-white">
            
            {/* User Info */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                    <User size={20} className="text-white" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate block max-w-[150px] sm:max-w-[200px]">
                  {fullName || "Người dùng"}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Ảnh đại diện
                </span>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                onClick={handleDownload}
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors tooltip-trigger"
                title="Tải ảnh xuống"
              >
                <Download size={20} />
              </button>
              
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                title="Mở tab mới"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarPreviewModal;