import { Link } from "react-router-dom";
import {
  FaFacebook, FaTwitter, FaLinkedin, FaGithub, FaYoutube, FaInstagram,
  FaPaperPlane, FaApple, FaGooglePlay, FaMapMarkerAlt, FaEnvelope,
  FaPhone, FaChevronRight, FaShieldAlt, FaAward, FaCertificate
} from "react-icons/fa";

const Footer = ({ compact = false }) => {
  const currentYear = new Date().getFullYear();

  // Navigation Links
  const footerLinks = {
    company: [
      { label: "Về chúng tôi", path: "/about" },
      { label: "Tuyển dụng", path: "/careers" },
      { label: "Đối tác", path: "/partners" },
      { label: "Tin tức", path: "/blog" },
      { label: "Liên hệ", path: "/contact" },
    ],
    candidate: [
      { label: "Tìm việc làm", path: "/jobs/search" },
      { label: "Công ty", path: "/companies" },
      { label: "Công cụ CV", path: "/cv-builder" },
      { label: "Hướng dẫn nghề nghiệp", path: "/career-guide" },
      { label: "Đánh giá lương", path: "/salary" },
    ],
    employer: [
      { label: "Đăng tin tuyển dụng", path: "/employer/post-job" },
      { label: "Tìm ứng viên", path: "/employer/candidates" },
      { label: "Bảng giá", path: "/pricing" },
      { label: "Giải pháp HR", path: "/hr-solutions" },
      { label: "Tài khoản doanh nghiệp", path: "/employer/register" },
    ],
    support: [
      { label: "Trung tâm hỗ trợ", path: "/help" },
      { label: "Câu hỏi thường gặp", path: "/faq" },
      { label: "Điều khoản sử dụng", path: "/terms" },
      { label: "Chính sách bảo mật", path: "/privacy" },
      { label: "Quy chế hoạt động", path: "/regulations" },
    ],
  };

  const stats = [
    { number: "5,000+", label: "Việc làm" },
    { number: "500+", label: "Công ty" },
    { number: "15,000+", label: "Ứng viên" },
    { number: "95%", label: "Hài lòng" },
  ];

  const certifications = [
    { icon: FaShieldAlt, text: "Bảo mật SSL" },
    { icon: FaAward, text: "Top 10 Sàn TDVN" },
    { icon: FaCertificate, text: "Đã xác thực" },
  ];

  if (compact) {
    return (
        <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Logo & Copyright */}
              <div className="flex items-center gap-6">
                <Link to="/" className="text-lg font-bold text-white flex items-center gap-2">
                  💼 Job<span className="text-blue-500">Finder</span>
                </Link>
                <span className="text-xs text-slate-500">
                © {currentYear} All rights reserved
              </span>
              </div>

              {/* Quick Links */}
              <div className="flex items-center gap-6 text-xs">
                <Link to="/about" className="hover:text-white transition-colors">Về chúng tôi</Link>
                <Link to="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
              </div>

              {/* Social Icons */}
              <div className="flex gap-3">
                {[
                  { Icon: FaFacebook, url: "https://facebook.com" },
                  { Icon: FaLinkedin, url: "https://linkedin.com" },
                  { Icon: FaYoutube, url: "https://youtube.com" },
                ].map(({ Icon, url }, idx) => (
                    <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Icon size={16} />
                    </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
    );
  }

  return (
      <footer className="relative bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400 overflow-hidden">

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        {/* Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ========== NEWSLETTER SECTION ========== */}
          <div className="py-12 border-b border-slate-800">
            <div className="grid md:grid-cols-2 gap-8 items-center">

              {/* Left: CTA */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Nhận thông báo việc làm mới
                </h3>
                <p className="text-slate-400 mb-6">
                  Đăng ký để nhận email về các cơ hội việc làm IT phù hợp với bạn mỗi tuần
                </p>

                {/* Newsletter Form */}
                <form className="flex gap-3">
                  <div className="flex-1 relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="email"
                        placeholder="Nhập email của bạn"
                        className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                  <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaPaperPlane />
                    Đăng ký
                  </button>
                </form>
              </div>

              {/* Right: Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all">
                      <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========== MAIN LINKS SECTION ========== */}
          <div className="py-12 border-b border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">

              {/* Column 1: Brand & Contact */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-white mb-4">
                    💼 Job<span className="text-blue-500">Finder</span>
                  </Link>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Nền tảng tuyển dụng IT hàng đầu Việt Nam, kết nối ứng viên tài năng với các công ty công nghệ uy tín.
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <FaMapMarkerAlt className="mt-1 text-blue-500 flex-shrink-0" />
                    <span>Tầng 12, Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FaPhone className="text-blue-500 flex-shrink-0" />
                    <a href="tel:1900xxxx" className="hover:text-white transition-colors">
                      1900 xxxx (8:00 - 22:00)
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FaEnvelope className="text-blue-500 flex-shrink-0" />
                    <a href="mailto:contact@jobfinder.vn" className="hover:text-white transition-colors">
                      contact@jobfinder.vn
                    </a>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">Kết nối với chúng tôi</h4>
                  <div className="flex gap-3">
                    {[
                      { Icon: FaFacebook, url: "#", color: "hover:bg-blue-600" },
                      { Icon: FaLinkedin, url: "#", color: "hover:bg-blue-700" },
                      { Icon: FaYoutube, url: "#", color: "hover:bg-red-600" },
                      { Icon: FaInstagram, url: "#", color: "hover:bg-pink-600" },
                      { Icon: FaGithub, url: "#", color: "hover:bg-slate-700" },
                    ].map(({ Icon, url, color }, idx) => (
                        <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all ${color}`}
                        >
                          <Icon size={18} />
                        </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Về công ty */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Về công ty</h4>
                <ul className="space-y-3">
                  {footerLinks.company.map((link, idx) => (
                      <li key={idx}>
                        <Link
                            to={link.path}
                            className="text-sm hover:text-white transition-colors flex items-center gap-2 group"
                        >
                          <FaChevronRight className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.label}
                        </Link>
                      </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Ứng viên */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Dành cho ứng viên</h4>
                <ul className="space-y-3">
                  {footerLinks.candidate.map((link, idx) => (
                      <li key={idx}>
                        <Link
                            to={link.path}
                            className="text-sm hover:text-white transition-colors flex items-center gap-2 group"
                        >
                          <FaChevronRight className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.label}
                        </Link>
                      </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Nhà tuyển dụng */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Nhà tuyển dụng</h4>
                <ul className="space-y-3">
                  {footerLinks.employer.map((link, idx) => (
                      <li key={idx}>
                        <Link
                            to={link.path}
                            className="text-sm hover:text-white transition-colors flex items-center gap-2 group"
                        >
                          <FaChevronRight className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.label}
                        </Link>
                      </li>
                  ))}
                </ul>
              </div>

              {/* Column 5: Hỗ trợ */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Hỗ trợ</h4>
                <ul className="space-y-3">
                  {footerLinks.support.map((link, idx) => (
                      <li key={idx}>
                        <Link
                            to={link.path}
                            className="text-sm hover:text-white transition-colors flex items-center gap-2 group"
                        >
                          <FaChevronRight className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.label}
                        </Link>
                      </li>
                  ))}
                </ul>

                {/* Download App */}
                <div className="mt-6 space-y-2">
                  <h5 className="text-white font-semibold text-xs mb-3">Tải ứng dụng</h5>
                  <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all group border border-slate-700"
                  >
                    <FaApple className="text-xl text-slate-400 group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500">Download on</div>
                      <div className="text-xs font-semibold text-white">App Store</div>
                    </div>
                  </a>
                  <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all group border border-slate-700"
                  >
                    <FaGooglePlay className="text-xl text-slate-400 group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500">Get it on</div>
                      <div className="text-xs font-semibold text-white">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ========== BOTTOM BAR ========== */}
          <div className="py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">

              {/* Copyright */}
              <div className="text-slate-500 text-xs text-center md:text-left">
                <p>© {currentYear} <span className="text-white font-semibold">JobFinder Technology JSC</span>. All rights reserved.</p>
                <p className="mt-1">Giấy phép hoạt động dịch vụ việc làm số: 18/SLĐTBXH-GP</p>
              </div>

              {/* Certifications */}
              <div className="flex items-center gap-4">
                {certifications.map(({ icon: Icon, text }, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Icon className="text-blue-500" />
                      <span className="text-slate-500">{text}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </footer>
  );
};

export default Footer;
