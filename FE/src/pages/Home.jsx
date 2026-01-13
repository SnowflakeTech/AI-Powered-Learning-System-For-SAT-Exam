import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-12">
        <section className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Hệ thống luyện đề tích hợp AI
              </span>
              <span className="hidden sm:inline-flex text-xs text-neutral-500">
                SAT • HSA
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Làm đề chuẩn, xem thống kê chi tiết,
              <span className="block text-emerald-700">
                luyện thi thông minh hơn mỗi ngày.
              </span>
            </h1>

            <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
              Nền tảng luyện thi thông minh giúp bạn trải nghiệm quy trình luyện thi HSA/SAT:
              chọn đề – làm bài – xem lịch sử – theo dõi thống kê. Giao diện đơn giản,
              tối ưu cho học tập và tự luyện mỗi ngày.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Bắt đầu ngay
              </Link>
              <Link
                to="/huong-dan"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50"
              >
                Xem hướng dẫn
              </Link>
              <Link
                to="/tra-cuu"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50"
              >
                Tra cứu lịch thi
              </Link>
            </div>

            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">Đề luyện</div>
                <div className="text-sm font-semibold mt-1">Math</div>
              </div>
              <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">Kỹ năng</div>
                <div className="text-sm font-semibold mt-1">Reading</div>
              </div>
              <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">Theo dõi</div>
                <div className="text-sm font-semibold mt-1">Thống kê</div>
              </div>
              <div className="rounded-2xl bg-white border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">Hỗ trợ</div>
                <div className="text-sm font-semibold mt-1">Trợ lý AI</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
              <div className="text-sm font-semibold text-neutral-900">
                Vì sao nên sử dụng hệ thống này?
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-emerald-50 px-3 py-3">
                  <p className="text-[11px] uppercase text-emerald-700 font-semibold">
                    Bám sát cấu trúc
                  </p>
                  <p className="text-base font-bold">Đề chuẩn</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Format rõ ràng, phân theo phần & kỹ năng.
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 px-3 py-3">
                  <p className="text-[11px] uppercase text-indigo-700 font-semibold">
                    Thống kê chi tiết
                  </p>
                  <p className="text-base font-bold">Rõ ràng</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Theo dõi điểm, thời gian, độ chính xác theo bài.
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 px-3 py-3">
                  <p className="text-[11px] uppercase text-amber-700 font-semibold">
                    Luyện tập linh hoạt
                  </p>
                  <p className="text-base font-bold">Mọi lúc</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Chỉ cần trình duyệt, phù hợp tự luyện.
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 px-3 py-3">
                  <p className="text-[11px] uppercase text-neutral-700 font-semibold">
                    Dễ dùng
                  </p>
                  <p className="text-base font-bold">Tối giản</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Tập trung nội dung, trải nghiệm làm bài mượt.
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs text-neutral-600 leading-relaxed">
                Đăng ký tài khoản, chọn bài thi đầu tiên và hệ thống sẽ đồng hành cùng bạn trong
                suốt quá trình luyện tập.
              </div>

              <div className="mt-4">
                <Link
                  to="/register"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-neutral-900 text-white hover:bg-black"
                >
                  Tạo tài khoản miễn phí
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">Luyện thi trên hệ thống trong 3 bước</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-semibold">Đăng ký & Đăng nhập</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Tạo tài khoản và đăng nhập để sử dụng đầy đủ tính năng.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-semibold">Chọn đề & làm bài</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Vào mục Luyện theo đề thi, chọn đề và bắt đầu làm bài.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-semibold">Xem lịch sử & thống kê</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Sau khi nộp bài, xem lại lịch sử làm bài và thống kê tiến độ.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">Tính năng chính nổi bật</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <h3 className="text-sm font-semibold">Đề thi chuẩn cấu trúc</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Đề luyện cho Math, Reading & Writing, mô phỏng cấu trúc đề thật ở mức cơ bản.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <h3 className="text-sm font-semibold">Lịch sử làm bài chi tiết</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Xem lại bài đã làm, thời gian, số câu đúng/sai và chi tiết từng câu hỏi.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 space-y-2">
              <h3 className="text-sm font-semibold">Thống kê & gợi ý ôn tập</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Theo dõi điểm trung bình, điểm cao nhất, độ chính xác và biểu đồ tiến độ.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">Câu hỏi thường gặp</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Một vài câu hỏi phổ biến khi bắt đầu sử dụng hệ thống.
              </p>
            </div>
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50"
            >
              Gửi phản hồi
            </Link>
          </div>

          <div className="space-y-3 text-sm text-neutral-700">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="font-semibold">
                Hệ thống hỗ trợ những loại bài thi và tính năng luyện tập nào?
              </div>
              <div className="mt-2 leading-relaxed">
                Hệ thống hỗ trợ luyện theo đề thi, luyện theo kỹ năng và xem thống kê chi tiết.
                Mỗi bài có phân tích đúng/sai và gợi ý cải thiện.
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="font-semibold">Sử dụng hệ thống có mất phí không?</div>
              <div className="mt-2 leading-relaxed">
                Hiện tại hệ thống miễn phí cho người dùng. Mục tiêu là cung cấp nền tảng luyện thi chất lượng.
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="font-semibold">Hệ thống này do ai phát triển?</div>
              <div className="mt-2 leading-relaxed">
                Hệ thống được xây dựng bởi Phạm Tiến Sơn, Lê Quốc Anh, Đặng Sỹ Toàn trong khuôn khổ học phần
                2526I_INT3220E_1 do giảng viên Nguyễn Ngọc Hóa hướng dẫn.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-neutral-900 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Sẵn sàng bắt đầu luyện thi?</div>
              <div className="text-sm text-white/80 mt-1">
                Tạo tài khoản miễn phí và bắt đầu với đề đầu tiên trong vài phút.
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-white text-neutral-900 font-semibold hover:bg-neutral-100"
              >
                Đăng ký
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 font-semibold hover:bg-white/15"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
