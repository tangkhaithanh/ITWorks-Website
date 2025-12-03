import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import {
  Camera,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  Trash2,
  RefreshCcw,
} from "lucide-react";

import CandidateAPI from "../CandidateAPI";
import Button from "@/components/ui/Button";

// ================= Helpers =================
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const { x, y, width, height } = pixelCrop;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
  });
}

// ================= Component =================
const AvatarUploadModal = ({
  open,
  onClose,
  currentAvatarUrl,
  onUploaded,
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setRawFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setSaving(false);
    }
  }, [open]);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "File không hợp lệ",
        text: "Vui lòng chọn file ảnh (JPG/PNG).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File quá lớn",
        text: "Kích thước tối đa là 5MB.",
      });
      return;
    }

    setRawFile(file);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result.toString());
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = rawFile?.name || "avatar.jpg";
      const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("avatar", croppedFile);

      await CandidateAPI.updateUser(formData);

      // --- Style gốc ---
      Swal.fire({
        icon: "success",
        title: "Cập nhật ảnh đại diện thành công",
        showConfirmButton: false,
        timer: 1500,
      });

      onUploaded?.();
      onClose();
    } catch (error) {
      console.error(error);
      // --- Style gốc ---
      Swal.fire({
        icon: "error",
        title: "Không thể cập nhật ảnh đại diện",
        text: "Vui lòng thử lại sau.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Ảnh đại diện</h3>
            <p className="text-sm text-slate-500">Thay đổi hình ảnh hiển thị của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!imageSrc ? (
            /* --- Upload Mode --- */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                group relative flex flex-col items-center justify-center h-64 
                border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                ${isDragOver 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className={`p-4 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110 ${isDragOver ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                {isDragOver ? <Upload size={32} /> : <Camera size={32} />}
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  {isDragOver ? "Thả ảnh vào đây ngay" : "Bấm để chọn hoặc kéo thả ảnh"}
                </p>
                <p className="text-xs text-slate-500">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
              </div>
            </div>
          ) : (
            /* --- Crop Mode --- */
            <div className="space-y-5">
              <div className="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden shadow-inner ring-1 ring-black/5 group">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
                
                <div className="absolute top-4 left-0 w-full text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                   <span className="px-3 py-1 text-xs font-medium text-white bg-black/40 backdrop-blur rounded-full">
                     Kéo để di chuyển
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <ZoomOut size={18} className="text-slate-400" />
                 <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                  />
                 <ZoomIn size={18} className="text-slate-400" />
              </div>

              <div className="flex justify-between items-center pt-2">
                 <button 
                   onClick={() => setImageSrc(null)}
                   className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                 >
                   <Trash2 size={16} /> Chọn ảnh khác
                 </button>
                 
                 <button 
                    onClick={() => { setZoom(1); setCrop({x:0, y:0}) }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2"
                 >
                    Đặt lại vị trí
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !imageSrc}
            className="min-w-[100px] shadow-lg shadow-blue-500/20"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCcw className="animate-spin" size={16} /> Lưu...
              </span>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;