import DOMPurify from "dompurify";
const JobRequirements = ({ requirements }) => {
  if (!requirements) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        🎯 Yêu cầu ứng viên
      </h2>
      <div
      className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-700
                [&_ul]:list-disc [&_ul]:pl-6 
                [&_li]:mb-1.5 [&_p]:mb-1 [&_strong]:text-slate-900 [&_strong]:font-semibold
                [&_li]::marker:text-black"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(requirements),
      }}
    />
    </section>
  );
};

export default JobRequirements;
