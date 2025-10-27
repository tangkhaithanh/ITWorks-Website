# 🧩 Recruitment System – Hướng dẫn cài đặt và chạy dự án

Dự án bao gồm **2 ứng dụng chính** trong một **mono-repo**:

* **Backend (NestJS + Prisma + MySQL)** → `backend/`
* **Frontend (React + Vite + Redux Toolkit + TailwindCSS)** → `frontend/`

---

## ⚙️ 1. Yêu cầu hệ thống

| Thành phần | Phiên bản khuyến nghị |
| ---------- | --------------------- |
| Node.js    | >= 18.x               |
| npm        | >= 9                  |
| MySQL      | 8.x hoặc 5.7          |
| Git        | Mới nhất              |

---

## 📁 2. Cấu trúc thư mục

### **Backend (NestJS)**

```
backend/
├── prisma/               # ORM Prisma (schema + migrations + seed)
├── src/
│   ├── common/           # Decorators, Guards, Filters, Interceptors
│   ├── config/           # Cấu hình DB, JWT, Mailer, Cloudinary
│   ├── prisma/           # Prisma Service & Module
│   ├── modules/          # Module theo domain (auth, users, jobs, cvs,…)
│   ├── app.module.ts
│   └── main.ts
├── test/
├── .env
└── package.json
```

### **Frontend (React + Vite)**

```
frontend/
├── public/
├── src/
│   ├── app/              # store, routes, rootReducer, hooks
│   ├── features/         # Chức năng domain (jobs, candidates, admin,…)
│   ├── components/       # UI chung (Button, Modal, Input,…)
│   ├── services/         # apiClient, upload, notification service
│   ├── hooks/, utils/, styles/
│   ├── App.jsx, main.jsx
│   └── vite.config.js
└── package.json
```

---

## 🧠 3. Chức năng và phân quyền

| Vai trò               | Quyền hạn chính                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| 👥 **Khách**          | Đăng ký, đăng nhập, tìm kiếm & xem công việc                                                                    |
| 🧑‍💼 **Ứng viên**    | Quản lý CV, tạo CV từ template, nộp đơn, lưu job, nhận thông báo realtime khi được duyệt                        |
| 🏢 **Nhà tuyển dụng** | Quản lý job (CRUD, ẩn/hiện), xem danh sách ứng viên ứng tuyển, chấp nhận / từ chối ứng viên, dashboard thống kê |
| 🛡️ **Admin**         | Duyệt công ty, khóa tài khoản, ẩn công ty gian lận, dashboard thống kê hệ thống                                 |

---

## 🗄️ 4. Chuẩn bị cơ sở dữ liệu

1. **Tạo database trong MySQL:**

   ```sql
   CREATE DATABASE recruitment;
   ```

2. **Cập nhật biến kết nối trong file `.env` của backend:**

   ```bash
   DATABASE_URL="mysql://root:password@localhost:3306/recruitment"
   JWT_SECRET="your_jwt_secret"
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

3. **Chạy migrate + seed:**

   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

---

## 🌩️ 5. Cấu hình môi trường (.env)

### **Backend (`backend/.env`)**

```bash
PORT=8080
DATABASE_URL="mysql://root:password@localhost:3306/recruitment"

JWT_SECRET=supersecret
FRONTEND_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=example@gmail.com
SMTP_PASS=app_password
SMTP_FROM="Recruitment System <example@gmail.com>"
```

### **Frontend (`frontend/.env`)**

```bash
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

---

## 🧰 6. Cài đặt dependencies

### **Backend**

```bash
cd backend
npm install
```

### **Frontend**

```bash
cd frontend
npm install
```

---

## 🚀 7. Chạy ứng dụng

### **Backend (NestJS + Prisma)**

```bash
cd backend
npm run start:dev
```

Truy cập API tại: [http://localhost:8080/api](http://localhost:8080/api)

### **Frontend (React + Vite)**

```bash
cd frontend
npm run dev
```

Truy cập web tại: [http://localhost:5173](http://localhost:5173)

---

## 🔔 8. Realtime Notifications

Hệ thống sử dụng **WebSocket Gateway (NestJS)** cho thông báo realtime giữa recruiter và candidate khi:

* Nhà tuyển dụng **chấp nhận / từ chối** CV.
* Admin **duyệt công ty hoặc khóa tài khoản.**
* Ứng viên **ứng tuyển thành công.**

---

## 📊 9. Dashboard & Thống kê

* **Recruiter Dashboard:** tổng số job, ứng viên, lượt xem job.
* **Admin Dashboard:** thống kê công ty, người dùng, lượng truy cập.
* **SiteStatistic / RecruiterStatistic:** dữ liệu thống kê lưu bằng Prisma.

---

## 🧩 10. Component UI nổi bật

Các component được thiết kế với **TailwindCSS**, hiệu ứng **gradient & blur**:

* `Button.jsx` – nút gradient, hover scale & ring.
* `TextInput.jsx` – input bo tròn, border gradient.
* `SelectInput.jsx` – dropdown đẹp, animation.
* `DatePickerInput.jsx` – chọn ngày có icon & shadow.

---

## 🧪 11. Test & Seed dữ liệu mẫu

* Unit & e2e test tại `backend/test/`
* Seed dữ liệu mẫu tại `prisma/seed.ts`

```bash
npx prisma db seed
```

---

## 🔧 12. Build & chạy production (tuỳ chọn)

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 🩶 13. Khắc phục sự cố thường gặp

| Lỗi                | Nguyên nhân & Cách xử lý                           |
| ------------------ | -------------------------------------------------- |
| ❌ Không kết nối DB | Kiểm tra `DATABASE_URL` và đảm bảo MySQL đang chạy |
| ⚠️ Lỗi upload file | Kiểm tra cấu hình Cloudinary trong `.env`          |
| 🚫 CORS blocked    | Cập nhật `FRONTEND_ORIGIN` trong backend `.env`    |
| 🧱 Port đang dùng  | Đổi `PORT` hoặc dừng tiến trình đang chiếm port    |
| 🕳️ Thiếu bảng     | Chạy lại `npx prisma migrate dev`                  |

---

## 🧾 14. Lệnh nhanh

| Mục đích          | Lệnh                                 |
| ----------------- | ------------------------------------ |
| Chạy backend dev  | `cd backend && npm run start:dev`    |
| Chạy frontend dev | `cd frontend && npm run dev`         |
| Tạo migration     | `npx prisma migrate dev --name init` |
| Seed dữ liệu      | `npx prisma db seed`                 |
| Build toàn dự án  | `npm run build`                      |

---


