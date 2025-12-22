# BE_FE_DEMO (NestJS + Sequelize + MySQL)

Backend này được thiết kế để **khớp với FE Demo** bạn gửi.

## Các endpoint FE đang gọi
- `POST /api/v1/auth/login` (x-www-form-urlencoded) → `{ success:true, data:{ accessToken } }`
- `POST /api/v1/user/register` (JSON) → tạo user
- `GET  /api/v1/user/me` (Bearer token)
- `PATCH /api/v1/user/change-password` (Bearer token)
- `GET  /api/v1/tests` (Bearer token)
- `POST /api/v1/tests` (admin) → tạo test
- `POST /api/v1/tests/:id/questions` (admin) → gắn questionIds vào test
- `GET  /api/v1/tests/:id/questions` (Bearer token) → `{ test, questions (kèm choices) }`
- `GET  /api/v1/question/all?page=1&limit=50` (Bearer token)
- `POST /api/v1/question/with-choices` (admin)
## AI (chat / sinh đề / gợi ý học)
- `POST /api/v1/ai/chat` (Bearer token) → `{ reply, conversationId }`
- `GET  /api/v1/ai/insights` (Bearer token) → thống kê học tập + điểm yếu
- `POST /api/v1/ai/generate-test` (Bearer token) → sinh đề luyện mới và tự gán vào user

- `POST /api/v1/tests/:id/attempts` (Bearer token) → submit attempt (history)
- `GET  /api/v1/history` (Bearer token)
- `GET  /api/v1/history/:attemptId` (Bearer token)
- `POST /api/v1/feedback` (Bearer token) → tạo feedback
- `GET  /api/v1/feedback/me` (Bearer token)
- `GET  /api/v1/feedback/:id` (owner/admin)
- `GET  /api/v1/feedback` (admin)
- `PATCH /api/v1/feedback/:id` (admin)

## Chạy dự án (Windows)
1) Tạo file `.env` từ `.env.example` và chỉnh `DB_NAME` đúng database đang dùng.
   - Với MySQL Windows theo cấu hình hiện tại: `DB_USER=root`, `DB_PASS=DNguyen2`.
2) Cài package:
```bash
npm install
```
3) (Nếu DB chưa có) tạo database và bảng:
- Bật `DB_SYNC=true` trong `.env` để Sequelize tự tạo bảng.
- Hoặc chạy script SQL trong thư mục `sql/`.

4) Chạy dev:
```bash
npm run start:dev
```

Server mặc định: `http://localhost:8000/api/v1`

## Bật AI bằng Gemini
Trong `.env`:
- `AI_MOCK=false`
- `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `AI_API_KEY=<GEMINI_KEY>`
- `AI_MODEL=gemini-2.0-flash` (hoặc `gemini-1.5-flash`)

Nếu chưa muốn tốn phí / chưa có key, để `AI_MOCK=true` thì hệ thống vẫn trả lời mẫu (để test UI).

## Cấu hình Gemini (AI)
1) Lấy API key trên Google AI Studio.
2) Trong `.env`:
```env
AI_MOCK=false
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_API_KEY=YOUR_GEMINI_API_KEY
AI_MODEL=gemini-2.0-flash
```
Nếu chưa có key, có thể để `AI_MOCK=true` để dùng chế độ demo/offline.

## Admin mặc định (seed tự động)
Khi chạy BE lần đầu, hệ thống sẽ **tự tạo/đảm bảo** tài khoản admin:
- Email: `admin@gmail.com`
- Password: `admin`

Bạn có thể đổi bằng ENV: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`.


## History (lịch sử làm bài)
- `POST /api/v1/tests/:id/attempts` (Bearer) body: `{ durationSec, answers }` để lưu kết quả.
- `GET /api/v1/history` (Bearer) danh sách lần làm bài.
- `GET /api/v1/history/:attemptId` (Bearer) chi tiết (hỗ trợ `attempt-1` hoặc `1`).
