import { useSearchParams,useNavigate } from "react-router-dom";
import {useState, useEffect, use } from "react";
import ResetPasswordForm from "../components/ResetPasswordForm";
import AuthAPI from "../AuthAPI";
import Swal from "sweetalert2";
const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [valid, setvalid]=useState(false);
    // kiểm tra ngay token khi pay load lần đầu tiên:
    useEffect(() => {
        const verify = async () => {
            try {
                await AuthAPI.verifyResetToken(token);
                setvalid(true);
            } catch (err) {// có throw exception là nhảy vô catch
               await Swal.fire({
                            icon: "warning",
                            title: "Thông tin chưa hợp lệ",
                            text: "Link đã hết hạn, vui lòng thử lại.",
                            confirmButtonText: "OK",
                            confirmButtonColor: "#F59E0B", // màu vàng
                            });
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [token, navigate]);
    if (loading) return <div>Đang kiểm tra link...</div>;
    if (!valid) return null;
     return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ResetPasswordForm token={token} />
    </div>
  );
};

export default ResetPasswordPage;