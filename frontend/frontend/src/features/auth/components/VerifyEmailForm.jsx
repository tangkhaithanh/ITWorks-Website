import { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import AuthAPI from "../AuthAPI";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import Swal from "sweetalert2";
import { validateField,validateForm, registerRules } from "@/utils/validator";
const VerifyEmailForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    const rule = registerRules.email;
    if (rule) {
      const err = validateField(value, rule);
      setError(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // gom dữ liệu form
    const formData = { email };
    // validate toàn form:
    const newErrors = validateForm(formData, { email: registerRules.email });
    if (Object.keys(newErrors).length > 0) {
            Swal.fire({
            icon: "warning",
            title: "Thông tin chưa hợp lệ",
            text: "Vui lòng kiểm tra lại các trường bị lỗi.",
            confirmButtonText: "OK",
            confirmButtonColor: "#F59E0B", // màu vàng
            });
            return;
        }
    // gọi API;
    try {
        await AuthAPI.sendResetPasswordEmail(email);
        await Swal.fire({
        icon: "success",
        title: "Thành công 🎉",
        text: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một email hướng dẫn đặt lại mật khẩu.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
        });
    }
    catch(error){
        Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
            error.response?.data?.message ||
            error.message ||
            "Đã có lỗi xảy ra. Vui lòng thử lại.",
        confirmButtonText: "OK",
        confirmButtonColor: "#EF4444",
        });
    }
};
  return (
     <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow-md max-w-md w-full"
    >
      <h2 className="text-xl font-semibold text-gray-700 text-center">
        Xác nhận Email
      </h2>
      <TextInput
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={handleChange}
        required
        error={error}
        placeholder="Nhập email của bạn"
      />
      <Button type="submit" className="w-full">
        Xác nhận
      </Button>

      <p className="text-center text-sm text-gray-600">
      <Link to="/login" className="text-indigo-600 hover:underline">
        Đã có tài khoản? Đăng nhập ngay?
      </Link>
    </p>
    </form>
  );
};
export default VerifyEmailForm;

