🧩 Recruitment System – Hướng dẫn cài đặt và chạy dự án
Dự án bao gồm 2 ứng dụng chính trong một mono-repo:

Backend (NestJS + Prisma + MySQL) → backend/

Frontend (React + Vite + Redux Toolkit + TailwindCSS) → frontend/
⚙️ 1. Yêu cầu hệ thống
| Thành phần | Phiên bản khuyến nghị |
| ---------- | --------------------- |
| Node.js    | >= 18.x               |
| npm        | >= 9                  |
| MySQL      | 8.x hoặc 5.7          |
| Git        | Mới nhất              |
2. Cấu trúc thư mục
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
Frontend (React + Vite)
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
🧠 3. Chức năng và phân quyền
| Vai trò               | Quyền hạn chính                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| 👥 **Khách**          | Đăng ký, đăng nhập, tìm kiếm & xem công việc                                                                    |
| 🧑‍💼 **Ứng viên**    | Quản lý CV, tạo CV từ template, nộp đơn, lưu job, nhận thông báo realtime khi được duyệt                        |
| 🏢 **Nhà tuyển dụng** | Quản lý job (CRUD, ẩn/hiện), xem danh sách ứng viên ứng tuyển, chấp nhận / từ chối ứng viên, dashboard thống kê |
| 🛡️ **Admin**         | Duyệt công ty, khóa tài khoản, ẩn công ty gian lận, dashboard thống kê hệ thống                                 |
4. Chuẩn bị cơ sở dữ liệu
1. Tạo database trong MySQL, ví dụ: CREATE DATABASE recruitment;
2. Cập nhật biến kết nối trong file .env của backend:
  DATABASE_URL="mysql://root:password@localhost:3306/recruitment"
  JWT_SECRET="your_jwt_secret"
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...

3. Chạy migrate + seed:
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma db seed
5. Cấu hình môi trường (.env)
1. Backend
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
2. Frontend (frontend/.env)
  VITE_API_URL=http://localhost:8080/api
  VITE_WS_URL=ws://localhost:8080
6. Cài đặt dependencies
# Backend
cd backend
npm install

# Frontend
cd frontend
cd frontend
npm install

7. Chạy ứng dụng
1. Backend
cd backend
npm start
Truy cập

2. Frontend
cd frontend
cd frontend
npm run dev
