import React from "react";
import Navbar from "../components/Navbar.jsx";

export default function Guide() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Tiêu đề chính */}
        <header>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            Hướng dẫn sử dụng hệ thống luyện thi HSA/SAT
          </h1>
        </header>

        {/* 1. Giới thiệu tổng quan */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">
            1. Hệ thống này dùng để làm gì?
          </h2>
          <p className="text-sm md:text-base text-neutral-700">
            Hệ thống luyện thi HSA/SAT được thiết kế để:
          </p>
          <ul className="list-disc list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>Luyện tập các bài thi thử theo cấu trúc gần với kỳ thi HSA/SAT.</li>
            <li>Theo dõi điểm số, tiến độ và lịch sử làm bài của thí sinh.</li>
            <li>
              Cung cấp thống kê, phân tích kỹ năng, gợi ý ôn tập cá nhân hóa
              (sau này khi kết nối AI/backend).
            </li>
          </ul>
          <p className="text-xs md:text-sm text-neutral-500">
            🔎 Hỗ trợ bạn ôn tập và luyện thi hiệu quả.
          </p>
        </section>

        {/* 2. Đăng ký tài khoản */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">
            2. Hướng dẫn đăng ký tài khoản
          </h2>
          <ol className="list-decimal list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>Ở góc trên bên phải, bấm nút <strong>Đăng ký</strong>.</li>
            <li>Điền email, mật khẩu và các thông tin cơ bản theo form hiển thị.</li>
            <li>Bấm <strong>Đăng ký</strong> để hoàn tất.</li>
          </ol>
          <p className="text-xs md:text-sm text-neutral-500">
            ⚠️ Hãy nhớ tài khoản cá nhân để tránh mất dữ liệu những bài đã làm.
          </p>
        </section>

        {/* 3. Đăng nhập */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">
            3. Hướng dẫn đăng nhập
          </h2>
          <ol className="list-decimal list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>Ở góc trên bên phải, bấm nút <strong>Đăng nhập</strong>.</li>
            <li>Nhập email và mật khẩu đã đăng ký.</li>
            <li>
              Sau khi đăng nhập thành công (trong bản thật), bạn sẽ được chuyển
              tới <strong>Màn hình chính</strong>.
            </li>
          </ol>
          <p className="text-xs md:text-sm text-neutral-500">
            💡 Sau bước này, bạn có thể tiếp cận các tính năng của hệ thống.
          </p>
        </section>

        {/* 4. Hướng dẫn làm bài thi thử */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">
            4. Làm bài thi thử & xem lịch sử
          </h2>
          <ol className="list-decimal list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>
              Sau khi đăng nhập, vào menu <strong>Màn hình chính</strong> để xem
              điểm tổng quan và bài thi gợi ý tiếp theo.
            </li>
            <li>
              Vào tab <strong>Bài thi</strong> để xem danh sách tất cả đề hiện
              có. Chọn một đề và bấm <strong>Start</strong> để bắt đầu làm bài.
            </li>
            <li>
              Khi hoàn thành, điểm số và thông tin bài làm sẽ được hiển thị trên
              màn hình kết quả.
            </li>
            <li>
              Vào tab <strong>Lịch sử làm bài</strong> để xem lại các bài đã làm,
              bấm <strong>Xem chi tiết</strong> để xem đúng/sai từng câu.
            </li>
          </ol>
        </section>

        {/* 5. Thống kê & Thống kê (Stats) */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">
            5. Thống kê & phân tích kết quả
          </h2>
          <p className="text-sm md:text-base text-neutral-700">
            Trang <strong>Thống kê</strong> (Stats) được thiết kế để hiển thị:
          </p>
          <ul className="list-disc list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>Điểm trung bình, điểm cao nhất, số bài đã làm.</li>
            <li>Biểu đồ tiến bộ theo thời gian (Overall/Math/Reading & Writing).</li>
            <li>Độ chính xác theo từng chủ đề và kỹ năng.</li>
            <li>
              Gợi ý học tập cá nhân hóa (Tích hợp AI).
            </li>
          </ul>
          <p className="text-xs md:text-sm text-neutral-500">
            Hỗ trợ tự đánh giá năng lực cá nhân.
          </p>
        </section>

        {/* 6. Một số lưu ý */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-semibold">6. Một số lưu ý khi dùng hệ thống</h2>
          <ul className="list-disc list-inside text-sm md:text-base text-neutral-700 space-y-1">
            <li>
              Sử dụng hệ thống vào đúng mục đích ôn tập các kỳ thi, không nhằm mục đích
              thương mại khác.
            </li>
            <li>
              Trong quá trình xây dựng hệ thống không thể tránh khỏi sai sót. 
              Mong người dùng góp ý nhằm mang tới các bản cập nhật với 
              trải nghiệm sử dụng tốt hơn.
            </li>
            <li>
              Cảm ơn các bạn rất nhiều!
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}