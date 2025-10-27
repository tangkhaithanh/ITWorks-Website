import { motion } from "framer-motion";
import DOMPurify from "dompurify";

const JobDescription = ({ description }) => {
  if (!description) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-all duration-300"
    >
      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold text-slate-800 mb-5 flex items-center gap-2">
        <span className="text-blue-600 text-2xl">📝</span>
        Mô tả công việc
      </h2>

      {/* Nội dung mô tả (HTML từ DB) */}
      <div
        className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-700
                  [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1.5"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
      />

      {/* Hiệu ứng gradient nhấn */}
      <div className="mt-6 h-[3px] w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
    </motion.section>
  );
};

export default JobDescription;
