import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthAPI from "../AuthAPI";
import { validateField, validateForm } from "@/utils/validator";
import Swal from "sweetalert2";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
const resetRules = {
  password: {
    required: true,
    minLength: 6,
    label: "Mật khẩu",
    pattern: {
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt",
    },
  },
  confirm: {
    required: true,
    label: "Xác nhận mật khẩu",
  },
};
const ResetPasswordForm = ({token})=>{
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ password: "", confirm: "" });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        let rule = resetRules[name];
        if(rule)
        {
            if(name==="confirm")
                rule= {...rule, match: { value: formData.password }};
            const error = validateField(value, rule);
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    // clone rule và thêm trường match cho confirm
    const rules = { ...resetRules, confirm: { ...resetRules.confirm, match: { value: formData.password } } };
    const newErrors = validateForm(formData, rules);
    if (Object.keys(newErrors).length > 0)
    {
       await Swal.fire({
                    icon: "warning",
                    title: "Thông tin chưa hợp lệ",
                    text: "Vui lòng kiểm tra lại các trường bị lỗi.",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#F59E0B", // màu vàng
                    });
                    return;
    }
    try {
      await AuthAPI.resetPassword(token, formData.password);

      await Swal.fire({
        icon: "success",
        title: "Thành công 🎉",
        text: "Bạn đã đặt lại mật khẩu thành công.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
      });
      navigate("/login");
    } catch (err) {
      console.error("❌ Lỗi reset password:", err); // In lỗi ra console

      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Bạn đã hết thời gian đặt lại mật khẩu. Vui lòng thử lại.",
        confirmButtonText: "OK",
        confirmButtonColor: "#DC2626", // 🔴 đỏ
      });
    }
  };

  return (
     <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow-md max-w-md w-full"
    >
      <h2 className="text-xl font-semibold text-gray-700 text-center">
        Đặt lại mật khẩu mới
      </h2>
      <TextInput
        label="Mật khẩu"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        error={errors.password}
        placeholder="Nhập mật khẩu mới"
      />
      <TextInput
        label="Xác nhận mật khẩu"
        type="password"
        name="confirm"
        value={formData.confirm}
        onChange={handleChange}
        required
        error={errors.confirm}
        placeholder="Nhập lại mật khẩu mới"
      />
      <Button type="submit" className="w-full">
        Xác nhận
      </Button>
    </form>
  );
};
export default ResetPasswordForm;