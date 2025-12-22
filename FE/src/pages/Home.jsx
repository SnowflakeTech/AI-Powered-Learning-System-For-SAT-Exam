import React from "react";
import Navbar from "../components/NavBar.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-12">
        {/* 1. HERO SECTION */}
        <section className="grid gap-8 md:grid-cols-2 items-center">
          {/* Text */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Hệ thống luyện đề tích hợp AI
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Làm đề chuẩn, xem thống kê chi tiết,
              <span className="block text-emerald-700">
                luyện thi thông minh hơn mỗi ngày.
              </span>
            </h1>
            <p className="text-sm md:text-base text-neutral-600">
              Nền tảng luyện thi thông minh giúp bạn trải nghiệm quy trình luyện thi HSA/SAT:
              chọn đề – làm bài – xem lịch sử – theo dõi thống kê. Tất cả trong một giao diện
              đơn giản, dễ dùng và tối ưu cho việc học tập.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/tests"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Bắt đầu làm đề
              </a>
              <a
                href="/huong-dan"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold border border-neutral-300 bg-white hover:bg-neutral-50"
              >
                Xem hướng dẫn
              </a>
            </div>

            <div className="flex flex-wrap gap-4 pt-3 text-xs text-neutral-500">
              <div>
                <span className="font-semibold text-neutral-800">
                  Đề luyện tập:
                </span>{" "}
                Math, Reading, Writing 
              </div>
              <div>
                <span className="font-semibold text-neutral-800">
                  Tính năng:
                </span>{" "}
                Lịch sử làm bài • Thống kê • Gợi ý ôn tập 
              </div>
            </div>
          </div>

          {/* Card mini stats bên phải */}
          {/* Card giới thiệu ngắn bên phải */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-800">
                Vì sao nên sử dụng hệ thống này?
              </h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <p className="text-[11px] uppercase text-emerald-700 font-semibold">
                    Bám sát cấu trúc
                  </p>
                  <p className="text-base font-bold">Đề chuẩn</p>
                  <p className="text-[11px] text-neutral-600">
                    Xây dựng theo format chuẩn, chia theo từng phần kỹ năng.
                  </p>
                </div>

                <div className="rounded-lg bg-indigo-50 px-3 py-2">
                  <p className="text-[11px] uppercase text-indigo-700 font-semibold">
                    Thống kê chi tiết
                  </p>
                  <p className="text-base font-bold">Rõ ràng</p>
                  <p className="text-[11px] text-neutral-600">
                    Theo dõi điểm, thời gian, độ chính xác từng bài &amp; từng câu.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-[11px] uppercase text-amber-700 font-semibold">
                    Luyện tập linh hoạt
                  </p>
                  <p className="text-base font-bold">Mọi lúc</p>
                  <p className="text-[11px] text-neutral-600">
                    Chỉ cần trình duyệt, phù hợp tự luyện hoặc học nhóm.
                  </p>
                </div>

                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-[11px] uppercase text-neutral-700 font-semibold">
                    Thiết kế thân thiện
                  </p>
                  <p className="text-base font-bold">Dễ dùng</p>
                  <p className="text-[11px] text-neutral-600">
                    Giao diện tối giản, tập trung vào nội dung &amp; trải nghiệm làm bài.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500">
                Đăng ký tài khoản, chọn bài thi đầu tiên và hệ thống sẽ đồng hành cùng bạn
                trong suốt quá trình chinh phục các đề thi.
              </p>
            </div>
          </div>

        </section>

        {/* 2. HOW IT WORKS */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">
            Luyện thi trên hệ thống trong 3 bước
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-semibold">Đăng ký & Đăng nhập</h3>
              <p className="text-sm text-neutral-600">
                Tạo tài khoản, đăng nhập để trải nghiệm luồng thi thử. Giúp bạn tiếp cận với các tính năng.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-semibold">Chọn đề & làm bài</h3>
              <p className="text-sm text-neutral-600">
                Vào tab <strong>Bài thi</strong>, chọn đề bài thi,
                 bấm <strong>Start</strong> để bắt đầu làm bài.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-semibold">
                Xem lịch sử & thống kê kết quả
              </h3>
              <p className="text-sm text-neutral-600">
                Sau khi nộp bài, vào <strong>Lịch sử làm bài</strong> và{" "}
                <strong>Thống kê</strong> để xem điểm số, đúng/sai từng câu và
                tiến độ làm bài.
              </p>
            </div>
          </div>
        </section>

        {/* 3. FEATURES */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">
            Tính năng chính nổi bật
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Đề thi chuẩn cấu trúc</h3>
              <p className="text-sm text-neutral-600">
                Gồm các đề luyện tập cho Math, Reading &amp; Writing, mô
                phỏng cấu trúc đề thật ở mức cơ bản.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold">
                Lịch sử làm bài & chi tiết từng câu
              </h3>
              <p className="text-sm text-neutral-600">
                Xem lại từng bài đã làm, thời gian, số câu đúng/sai, và chi
                tiết từng câu hỏi.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-neutral-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Thống kê & gợi ý ôn tập</h3>
              <p className="text-sm text-neutral-600">
                Trang Thống kê hiển thị điểm trung bình, điểm cao nhất, độ chính
                xác và gợi ý học tập cá nhân hóa.
              </p>
            </div>
          </div>
        </section>

        {/* 5. FAQ mini */}
        <section className="bg-white rounded-xl shadow-sm ring-1 ring-neutral-200 p-6 space-y-3">
          <h2 className="text-xl font-bold mb-1">Câu hỏi thường gặp</h2>
          <div className="space-y-2 text-sm text-neutral-700">
            <div>
              <p className="font-semibold">
                Hệ thống hỗ trợ những loại bài thi và tính năng luyện tập nào?
              </p>
              <p>
                Hệ thống hỗ trợ các bài thi thử theo từng phần, bài luyện 
                theo chủ đề, và các bài kiểm tra ngắn để ôn tập nhanh. Mỗi bài thi
                đi kèm thống kê chi tiết, phân tích câu đúng/sai, độ khó câu hỏi và gợi ý
                khu vực cần luyện thêm.
              </p>
            </div>
            <div>
              <p className="font-semibold">Sử dụng hệ thống có mất phí không?</p>
              <p>
                Hệ thống hiện tại hoàn toàn miễn phí cho người dùng. Mục tiêu là cung cấp
                một nền tảng luyện thi chất lượng mà không ràng buộc về tài chính.
              </p>
            </div>
            <div>
              <p className="font-semibold">
                Hệ thống này do ai phát triển?
              </p>
              <p>
                Hệ thống được xây dựng và phát triển bởi các thành viên thuộc 
                nhóm 12 và 13 trong khuôn khổ học phần 2526I_INT3220E_1 do 
                giảng viên Nguyễn Ngọc Hóa hướng dẫn.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
