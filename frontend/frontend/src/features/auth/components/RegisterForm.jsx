import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthAPI from "../AuthAPI";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Swal from "sweetalert2";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { validateField,validateForm, registerRules} from "@/utils/validator";
const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    avatarUrl: "",
  });
  const [isEmployer, setIsEmployer] = useState(false);
  const [errors, setErrors] = useState({}); 
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const rule= registerRules[name];
    if(rule)
    {
        const error= validateField(value, rule);
        setErrors((prev)=>({...prev, [name]: error}));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Validate form trước
    const newErrors = validateForm(formData, registerRules);
    setErrors(newErrors);

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

    try {
        // 🔹 Gọi API theo role
        if (isEmployer) {
        await AuthAPI.registerRecruiter(formData);
        } else {
        await AuthAPI.registerCandidate(formData);
        }

        // 🔹 Thông báo thành công
        await Swal.fire({
        icon: "success",
        title: "Đăng ký thành công 🎉",
        text: "Vui lòng kiểm tra email để xác nhận tài khoản.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
        });

        // // 👉 Điều hướng sau khi user bấm OK
        navigate("/login");
    } catch (err) {
        // 🔹 Thông báo lỗi từ backend
        Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err.response?.data?.message || "Đăng ký thất bại",
        confirmButtonText: "Thử lại",
        confirmButtonColor: "#EF4444", // đỏ
        });
    }
};
return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl ml-8 mr-auto bg-white shadow-lg rounded-xl p-8 space-y-6"
    >
      <h2 className="text-xl font-bold text-center">Đăng ký tài khoản</h2>

      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      {/* ✅ Tick chọn vai trò */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isEmployer"
          checked={isEmployer}
          onChange={(e) => setIsEmployer(e.target.checked)}
        />
        <label htmlFor="isEmployer" className="text-sm">
          Tôi muốn đăng ký với vai trò <b>Nhà tuyển dụng</b>
        </label>
      </div>
      <p className="text-xs text-gray-500">
        Nếu không chọn, mặc định tài khoản sẽ đăng ký là <b>Ứng viên</b>.
      </p>

      <TextInput
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        error={errors.email}
      />
      <TextInput
        label="Mật khẩu"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        error={errors.password}
      />
      <TextInput
        label="Họ và tên"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        required
        error={errors.fullName}
      />
      <TextInput
        label="Số điện thoại"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
      />
      <DatePickerInput
        label="Ngày sinh"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
        error={errors.dob}
      />
      <SelectInput
        label="Giới tính"
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        options={[
            { value: "male", label: "Nam" },
            { value: "female", label: "Nữ" },
            { value: "other", label: "Khác" },
        ]}
        />
      <TextInput
        label="Địa chỉ"
        name="address"
        value={formData.address}
        onChange={handleChange}
        error={errors.address}
      />

      <Button type="submit" className="w-full">
        Đăng ký
      </Button>
    </form>
  );
}


export default RegisterForm;
