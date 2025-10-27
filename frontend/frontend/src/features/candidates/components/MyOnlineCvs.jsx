import { useEffect, useState } from "react";
import CvAPI from "../CvAPI";
import Button from "@/components/ui/Button";
import { FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";

const MyOnlineCvs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await CvAPI.getMyOnlineCvs();
        setCvs(res.data.data.items);
      } catch (err) {
        console.error("❌ Lỗi khi load CV:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Đang tải CV online...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">CV Online của tôi</h2>

      {cvs.length === 0 ? (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500">
          Bạn chưa có CV nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="p-4 bg-white rounded-2xl shadow hover:shadow-lg border border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-blue-600 w-5 h-5" />
                <h3 className="font-semibold text-slate-800">{cv.title}</h3>
              </div>

              {cv.template && (
                <p className="text-sm text-slate-500 mb-1">
                  Mẫu: {cv.template.name}
                </p>
              )}

              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={14} />{" "}
                {format(new Date(cv.created_at), "dd/MM/yyyy", { locale: vi })}
              </p>

              <div className="mt-3 flex gap-3">
                <Button variant="outline" size="sm">
                  Xem
                </Button>
                <Button size="sm" variant="green">
                  Sửa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOnlineCvs;
