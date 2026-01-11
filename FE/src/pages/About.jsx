import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Về chúng tôi
            </h1>
            <p className="text-neutral-600">
              Nền tảng luyện thi HSA/SAT tích hợp AI giúp luyện tập theo cấu trúc chuẩn,
              theo dõi tiến độ và cải thiện hiệu quả học tập.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-neutral-200 p-5">
              <div className="text-sm font-semibold text-neutral-900">Tác giả</div>
              <div className="mt-1 text-lg font-bold text-neutral-900">Phạm Sơn & Lê Quốc Anh</div>
              <div className="mt-3 space-y-2 text-neutral-700">
                <p>
                  Dự án hướng tới trải nghiệm luyện thi đơn giản, rõ ràng: chọn đề – làm bài –
                  xem lịch sử – thống kê; đồng thời tích hợp trợ lý AI để giải thích và gợi ý ôn tập.
                </p>
                <p>
                  Bạn có thể gửi góp ý qua mục Feedback trong hệ thống để dự án ngày càng hoàn thiện.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-5">
              <div className="text-sm font-semibold text-neutral-900">Tính năng</div>
              <ul className="mt-3 space-y-2 text-neutral-700 list-disc pl-5">
                <li>Luyện đề theo cấu trúc HSA/SAT</li>
                <li>Lưu lịch sử & thống kê chi tiết</li>
                <li>Trợ lý AI giải thích & gợi ý</li>
                <li>Giao diện tối giản, dễ dùng</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 transition"
            >
              Về trang chủ
            </Link>
            <Link
              to="/huong-dan"
              className="px-4 py-2 rounded-full bg-white text-green-800 font-semibold border border-green-200 hover:bg-green-50 transition"
            >
              Xem hướng dẫn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
