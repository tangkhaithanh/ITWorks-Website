// src/utils/validator.js

// =========================
// Common Regex Patterns
// =========================
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // email chuẩn
  phoneVN: /^0\d{9}$/,                 // số VN: bắt đầu bằng 0, 10 số
  username: /^[a-zA-Z0-9]+$/,          // chỉ chữ + số
  passwordSpecial: /[!@#$%^&*(),.?":{}|<>]/, // có ký tự đặc biệt
  cccd: /^\d{9,12}$/,                  // CMND/CCCD: 9–12 số
};

// =========================
// Validate 1 field
// =========================
export const validateField = (value, rule) => {
  if (rule.required && !value) {
    return `${rule.label} là bắt buộc`;
  }

  if (rule.email && value && !patterns.email.test(value)) {
    return `${rule.label} không hợp lệ`;
  }

  if (rule.minLength && value && value.length < rule.minLength) {
    return `${rule.label} phải có ít nhất ${rule.minLength} ký tự`;
  }

  if (rule.maxLength && value && value.length > rule.maxLength) {
    return `${rule.label} không được vượt quá ${rule.maxLength} ký tự`;
  }

  if (rule.numeric && value && !/^[0-9]+$/.test(value)) {
    return `${rule.label} chỉ được chứa số`;
  }

  if (rule.pattern && value && !rule.pattern.regex.test(value)) {
    return rule.pattern.message || `${rule.label} không đúng định dạng`;
  }
  // Trường hợp validate 2 trường password và confirmPassword
  if (rule.match && value !== rule.match.value) {
    return `${rule.label} không khớp`;
  }

  return null;
};

// =========================
// Validate toàn form
// =========================
export const validateForm = (data, rules) => {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const error = validateField(data[field], rules[field]);//dùng biến đại diện cho key trong vòng lặp → bắt buộc dùng bracket notation:
    if (error) errors[field] = error;
  });
  return errors;
};

// =========================
// Rule Mẫu
// =========================

// Đăng ký
// dùng hàm này lấy rule ra để validate từng field khi nhập
// và validate toàn form khi submit
export const registerRules = {
  email: { required: true, email: true, label: "Email" },

  password: {
    required: true,
    minLength: 6,
    pattern: {
      regex: patterns.passwordSpecial,
      message: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt",
    },
    label: "Mật khẩu",
  },

  fullName: { required: true, label: "Họ và tên" },

  phone: {
    required: true,
    pattern: {
      regex: patterns.phoneVN,
      message: "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số",
    },
    label: "Số điện thoại",
  },

  dob: { date: true, label: "Ngày sinh" },
};

// // Đăng nhập
// export const loginRules = {
//   email: { required: true, email: true, label: "Email" },
//   password: { required: true, label: "Mật khẩu" },
// };
