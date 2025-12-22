# 🎓 FULL STACK SAT – HSA AI LEARNING SYSTEM

Hệ thống luyện thi **SAT / HSA** full-stack, tích hợp **AI (Gemini)** hỗ trợ:
- Luyện đề
- Chat trợ lý học tập
- Sinh đề thông minh theo điểm yếu
- Thống kê – gợi ý chiến lược học tập

---

## 📌 Tổng quan hệ thống

### Người dùng (Student)
- Đăng ký / Đăng nhập
- Xem danh sách đề thi
- Làm bài thi 
- Xem lịch sử làm bài
- Xem thống kê học tập (Stats)
- Chat với **AI Trợ lý học tập**
- Nhận gợi ý chiến lược & sinh đề luyện tập

### Quản trị viên (Admin)
- Tạo / chỉnh sửa / xóa đề thi
- Thêm – sửa – xóa câu hỏi & đáp án
- Xem toàn bộ feedback người dùng
- Quản lý dữ liệu đề thi

---

## 🧠 AI TÍCH HỢP (Gemini)

AI trong hệ thống có các chức năng:

- 💬 **Chat với user**
  - Hỏi cách sử dụng hệ thống
  - Giải thích chiến lược làm SAT / HSA
  - Trả lời câu hỏi học tập

- 📝 **Sinh đề luyện tập thông minh**
  - Dựa trên lịch sử làm bài
  - Tập trung vào kỹ năng yếu
  - Tự động tạo đề mới trong DB

- 📊 **Phân tích & gợi ý học tập**
  - Điểm trung bình
  - Điểm cao nhất
  - Thời gian làm bài
  - Tốc độ làm 1 câu
  - Gợi ý kỹ năng cần cải thiện

> AI sử dụng **Google Gemini API** (free tier).

---

## 🏗️ Kiến trúc hệ thống
FULL SYSTEM
│
├── BE/ # Backend (NestJS + MySQL + Sequelize)
│ ├── src/
│ │ ├── auth/ # Auth + JWT
│ │ ├── users/
│ │ ├── tests/
│ │ ├── exam/
│ │ ├── history/
│ │ ├── stats/
│ │ ├── feedback/
│ │ └── ai/ # AI Gemini integration
│ └── sql/ # schema + sample data
│
├── FE/ # Frontend (React + Vite)
│ ├── src/
│ │ ├── pages/
│ │ │ ├── Login
│ │ │ ├── Register
│ │ │ ├── Tests
│ │ │ ├── Exam
│ │ │ ├── History
│ │ │ ├── Stats
│ │ │ ├── Feedback
│ │ │ └── StudyAssistant (AI)
│ │ ├── components/
│ │ └── auth/
│ └── public/
│
└── README.md

---

## ⚙️ Công nghệ sử dụng

### Backend
- **NestJS**
- **Sequelize ORM**
- **MySQL**
- **JWT Authentication**
- **Google Gemini API**

### Frontend
- **React + Vite**
- **TailwindCSS**
- **React Router**
- **Axios**

---

### 🛠️ Cài đặt & chạy dự án
1️⃣ Clone prject

git clone https://github.com/<USERNAME>/FULL_STACK_SAT_HSA_AI_SYS.git
cd FULL_SYSTEM
 2️⃣ Cấu hình Database (MySQL)

Tạo database:

CREATE DATABASE sat_hsa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


Import schema:

mysql -u root -p sat_hsa < BE/sql/schema.sql


(Tùy chọn) dữ liệu mẫu:

mysql -u root -p sat_hsa < BE/sql/sample_data.sql

3️⃣ Cấu hình Backend (BE)

Tạo file:

BE/.env


Ví dụ:

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sat_hsa

JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=7d

AI_PROVIDER=gemini
AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
AI_MODEL=models/gemini-2.5-flash


Chạy BE:

cd BE
npm install
npm run start:dev


Backend chạy tại:

http://localhost:8000/api/v1

4️⃣ Cấu hình Frontend (FE)

Tạo file:

FE/.env

VITE_API_BASE=http://localhost:8000/api/v1


Chạy FE:

cd FE
npm install
npm run dev


Frontend chạy tại:

http://localhost:5173

🔐 Tài khoản mẫu
Admin
Email: admin@gmail.com
Password: admin

Student

Đăng ký trực tiếp trên giao diện

📊 Các module chính
Module	Mô tả
Tests	Danh sách đề thi
Exam	Làm bài
History	Lịch sử làm bài
Stats	Thống kê học tập
Feedback	Gửi phản hồi
Study Assistant	Chat AI + sinh đề
🚀 Hướng phát triển

Adaptive testing (IRT)

Recommendation nâng cao

AI giải thích từng câu

Leaderboard

Export kết quả PDF

📜 Ghi chú

File .env KHÔNG push lên GitHub

Dùng .env.example cho tham khảo

Gemini free tier có giới hạn request/ngày

👨‍💻 Tác giả

Project: FULL STACK SAT – HSA AI LEARNING SYSTEM

Mục đích: Đồ án / Nghiên cứu / Demo hệ thống AI giáo dục
