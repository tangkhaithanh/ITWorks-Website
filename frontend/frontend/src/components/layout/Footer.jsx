// src/components/layouts/Footer.jsx
import { Link } from "react-router-dom";
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaGithub, 
  FaPaperPlane, FaApple, FaGooglePlay, FaMapMarkerAlt, FaEnvelope, FaPhone 
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 text-slate-400 font-sans text-sm overflow-hidden">
      
      {/* --- BACKGROUND DECORATION --- */}
      {/* Grid pattern mờ, đồng bộ với HomePage nhưng tối hơn */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-20 pointer-events-none"></div>
      
      {/* Gradient Glow effect */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        
        {/* 1. NEWSLETTER SECTION (Call to Action) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 mb-16 shadow-lg">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">Đừng bỏ lỡ công việc mơ ước</h3>
            <p className="text-slate-400">Đăng ký để nhận thông báo việc làm IT mới nhất mỗi tuần.</p>
          </div>
          <div className="w-full md:w-auto">
            <form className="flex w-full max-w-md mx-auto md:mx-0">
              <input 
                type="email" 
                placeholder="Email của bạn..." 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 border-r-0 rounded-l-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-600"
              />
              <button 
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg font-semibold transition-colors flex items-center gap-2"
              >
                <span>Gửi</span> <FaPaperPlane size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* 2. MAIN LINKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Contact */}
          <div className="space-y-6">
            <div>
              <Link to="/" className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                💼 Job<span className="text-blue-500">Finder</span>
              </Link>
              <p className="mt-4 text-slate-400 leading-relaxed">
                Nền tảng tuyển dụng IT hàng đầu Việt Nam. Kết nối nhân tài với các công ty công nghệ tốt nhất.
              </p>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 text-blue-500" />
                <span>Tầng 12, Tòa nhà Bitexco, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-blue-500" />
                <a href="mailto:contact@jobfinder.vn" className="hover:text-white transition-colors">contact@jobfinder.vn</a>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-blue-500" />
                <a href="tel:02812345678" className="hover:text-white transition-colors">(028) 1234 5678</a>
              </li>
            </ul>
          </div>

          {/* Candidates */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Dành cho ứng viên</h3>
            <ul className="space-y-3">
              {['Tìm việc làm', 'Việc làm IT mới nhất', 'Tạo CV Online', 'Cẩm nang nghề nghiệp', 'Việc làm Remote'].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-blue-400 transition-all duration-200 hover:pl-1 block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Nhà tuyển dụng</h3>
            <ul className="space-y-3">
              {['Đăng tin tuyển dụng', 'Tìm hồ sơ ứng viên', 'Giải pháp nhân sự', 'Báo giá dịch vụ', 'Đối tác chiến lược'].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-blue-400 transition-all duration-200 hover:pl-1 block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Download & Social */}
          <div>
             <h3 className="text-white font-bold text-lg mb-6">Tải ứng dụng</h3>
             <p className="mb-4 text-slate-500 text-xs">Tìm việc mọi lúc mọi nơi với ứng dụng JobFinder.</p>
             <div className="flex flex-col gap-3 mb-8">
               <button className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all group">
                 <FaApple size={24} className="text-white" />
                 <div className="text-left">
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Download on the</div>
                   <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">App Store</div>
                 </div>
               </button>
               <button className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all group">
                 <FaGooglePlay size={22} className="text-white" />
                 <div className="text-left">
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Get it on</div>
                   <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Google Play</div>
                 </div>
               </button>
             </div>
          </div>
        </div>

        {/* 3. FOOTER BOTTOM */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-xs md:text-sm text-center md:text-left">
            <p className="mb-2">© {currentYear} JobFinder Technology JSC. All rights reserved.</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <Link to="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
              <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            {[
              { icon: <FaFacebook />, color: "hover:bg-[#1877F2]" },
              { icon: <FaLinkedin />, color: "hover:bg-[#0A66C2]" },
              { icon: <FaTwitter />, color: "hover:bg-[#1DA1F2]" },
              { icon: <FaGithub />, color: "hover:bg-[#333]" }
            ].map((social, idx) => (
              <a 
                key={idx} 
                href="#" 
                className={`w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center transition-all duration-300 hover:-translate-y-1 ${social.color}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;