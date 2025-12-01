import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
  closeOnOverlay = true,
  showCloseButton = true
}) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-modalOverlay"
        onClick={() => closeOnOverlay && onClose?.()}
      />

      {/* CONTENT */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} p-6 animate-modalContent`}
      >
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X size={22} />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
