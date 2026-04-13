import { useEffect, useRef, useState } from "react";
import {
  Download,
  Calendar,
  FileText,
  Eye,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import { useSelector } from "react-redux";
import CandidateAPI from "../CandidateAPI";

const CVFileCard = ({
  cv,
  onDelete,
  onToggleSearchable,
  isDeleting = false,
  isTogglingSearchable = false,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!cv?.file_url) return;

    try {
      const filename = cv.file_url.split("/").pop();
      const res = await CandidateAPI.viewCv(filename);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Loi khi tai CV:", error);
      alert("Khong the hien thi file CV. Vui long thu lai.");
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    await onDelete?.(cv);
  };

  const handleToggleSearchable = async () => {
    await onToggleSearchable?.(cv.id, !cv?.is_searchable);
  };

  const isBusy = isDeleting || isTogglingSearchable;

  return (
    <div className="group relative w-full sm:w-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-visible cursor-pointer">
      <div
        className="h-40 bg-slate-50 flex items-center justify-center relative border-b border-slate-100 rounded-t-2xl"
        onClick={handleDownload}
      >
        <div className="w-20 h-28 bg-white border border-slate-200 shadow-md rounded-lg flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
          <div className="absolute top-0 right-0 w-6 h-6 bg-slate-100 rounded-bl-lg"></div>
          <FileText className="text-red-500 mb-2" size={32} strokeWidth={1.5} />
          <div className="w-12 h-1 bg-slate-200 rounded mb-1"></div>
          <div className="w-10 h-1 bg-slate-200 rounded mb-1"></div>
          <div className="w-8 h-1 bg-slate-200 rounded"></div>
        </div>

        <div className="absolute top-3 right-3 z-20 flex items-center gap-2" ref={menuRef}>
          <div className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200">
            PDF
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              menuOpen
                ? "bg-white text-slate-700 border-slate-200 shadow-sm"
                : "bg-white/90 text-slate-500 border-white/80 hover:text-slate-700 hover:bg-white"
            }`}
            aria-label="Mo menu CV"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Chế độ tìm kiếm</p>
                  <p className="text-xs text-slate-500">
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSearchable}
                  disabled={isBusy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    cv?.is_searchable ? "bg-emerald-500" : "bg-slate-300"
                  } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
                  aria-pressed={!!cv?.is_searchable}
                  aria-label="Toggle searchable"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      cv?.is_searchable ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                  {isTogglingSearchable && (
                    <Loader2
                      size={12}
                      className="absolute inset-0 m-auto animate-spin text-white"
                    />
                  )}
                </button>
              </div>

              <div className="my-2 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleDelete}
                disabled={isBusy}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Xóa CV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 h-40 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto rounded-t-2xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-5 py-2 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-medium text-sm"
        >
          <Eye size={16} /> Xem ngay
        </button>
      </div>

      <div className="p-4 bg-white rounded-b-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-semibold text-slate-800 truncate"
              title={cv?.title || "Khong co ten"}
            >
              {cv?.title || "CV chua dat ten"}
            </h4>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  cv?.is_searchable
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {cv?.is_searchable ? "Đang bật tìm kiếm" : "Đang tắt tìm kiếm"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <Calendar size={12} className="text-slate-400" />
              <span>
                {cv?.updated_at
                  ? format(new Date(cv.updated_at), "dd 'thg' MM, yyyy", {
                      locale: vi,
                    })
                  : "Chua cap nhat"}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Tai xuong / Xem"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVFileCard;
