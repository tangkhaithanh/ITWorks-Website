import { Link } from "react-router-dom";
import {
  FaFacebook, FaTwitter, FaLinkedin, FaGithub,
  FaPaperPlane, FaApple, FaGooglePlay, FaMapMarkerAlt, FaEnvelope, FaPhone
} from "react-icons/fa";

const Footer = ({ compact = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`relative bg-slate-950 text-slate-400 font-sans text-sm overflow-hidden border-t border-slate-900 transition-all duration-300 ${compact ? 'py-6' : 'pt-16 pb-8'}`}>

      {/* --- BACKGROUND DECORATION (Chỉ hiện ở Full Mode) --- */}
      {!compact && (
        <>
          <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-20 pointer-events-none"></div>
          <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-6">

        {/* 1. NEWSLETTER SECTION (Chỉ hiện ở Full Mode) */}
        {!compact && (
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 mb-12 shadow-lg">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-bold text-white">Đăng ký nhận tin tuyển dụng</h3>
              <p className="text-slate-400 text-xs mt-1">Việc làm IT mới nhất mỗi tuần.</p>
            </div>
            <div className="w-full md:w-auto">
              <form className="flex w-full max-w-sm mx-auto md:mx-0">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 border-r-0 rounded-l-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-600 text-sm"
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. MAIN LINKS GRID (Ẩn bớt cột khi Compact) */}
        {!compact ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* ... (Giữ nguyên nội dung các cột như cũ) ... */}
            {/* Để tiết kiệm không gian comment, bạn giữ nguyên code phần Brand, Candidate, Employer, Download ở đây */}
            {/* Cột 1: Brand */}
            <div className="space-y-4">
              <Link to="/" className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                💼 Job<span className="text-blue-500">Finder</span>
              </Link>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>Tầng 12, Bitexco, Q.1, TP.HCM</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-blue-500 flex-shrink-0" />
                  <a href="mailto:contact@jobfinder.vn">contact@jobfinder.vn</a>
                </li>
              </ul>
            </div>

            {/* Cột 2, 3, 4: Giữ nguyên logic cũ nhưng giảm padding/margin nếu cần */}
            {/* ... */}
          </div>
        ) : null}

        {/* 3. FOOTER BOTTOM (Luôn hiện, nhưng layout khác nhau) */}
        <div className={`flex flex-col md:flex-row justify-between items-center gap-4 ${!compact ? 'border-t border-slate-800 pt-8' : ''}`}>

          {/* Copyright */}
          <div className="text-slate-500 text-xs text-center md:text-left">
            <p className="flex items-center gap-1 justify-center md:justify-start">
              {compact && <span className="font-bold text-slate-300">JobFinder</span>}
              © {currentYear} Technology JSC.
              {!compact && "All rights reserved."}
            </p>
          </div>

          {/* Links chính sách (Chỉ hiện full link ở chế độ full, hoặc thu gọn ở compact) */}
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
            {!compact && <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>}
          </div>

          {/* Social Icons (Nhỏ hơn ở chế độ compact) */}
          <div className="flex gap-3">
            {[FaFacebook, FaLinkedin, FaGithub].map((Icon, idx) => (
              <a key={idx} href="#" className="text-slate-500 hover:text-white transition-colors">
                <Icon size={compact ? 16 : 20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;