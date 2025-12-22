// src/pages/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet } from "../lib/apiClient.js";

function unwrap(res) {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;
  return payload?.data ?? payload;
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await apiGet("/history");
        const list = unwrap(res);
        setHistory(Array.isArray(list) ? list : []);
      } catch (e) {
        setErr(e?.message || "Không tải được lịch sử làm bài");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Lịch sử làm bài</h1>

        {loading ? (
          <div className="text-neutral-600">Đang tải lịch sử...</div>
        ) : err ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
        ) : !history.length ? (
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 text-neutral-600">
            Chưa có bài làm nào. Hãy vào <b>Bài thi</b> và làm thử 1 đề.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 bg-neutral-100 px-4 py-3 text-sm font-medium">
              <div className="col-span-4">Đề thi</div>
              <div className="col-span-2">Ngày</div>
              <div className="col-span-2">Điểm</div>
              <div className="col-span-2">Thời gian</div>
              <div className="col-span-1">Trạng thái</div>
              <div className="col-span-1 text-right"></div>
            </div>

            {history.map((h, i) => (
              <div
                key={h.id || h.attemptId || i}
                className={`grid grid-cols-12 items-center px-4 py-4 text-sm ${
                  i !== history.length - 1 ? "border-b border-neutral-100" : ""
                }`}
              >
                {/* Name */}
                <div className="col-span-12 md:col-span-4">
                  <div className="font-medium">{h.testName}</div>
                  <div className="mt-1 text-xs text-neutral-500 md:hidden">
                    {h.date} • {h.score} / {h.totalScore} • {h.time}
                  </div>
                </div>

                {/* Date */}
                <div className="hidden md:block md:col-span-2 text-neutral-700">
                  {h.date || "-"}
                </div>

                {/* Score */}
                <div className="hidden md:block md:col-span-2 text-neutral-700">
                  {h.score} / {h.totalScore}
                </div>

                {/* Time */}
                <div className="hidden md:block md:col-span-2 text-neutral-700">
                  {h.time}
                </div>

                {/* Status */}
                <div className="col-span-6 md:col-span-1 mt-2 md:mt-0">
                  {(["completed","finished","done"].includes(String(h.status || "").toLowerCase())) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                      Hoàn thành
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Đang làm
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="col-span-6 md:col-span-1 md:text-right mt-3 md:mt-0">
                  <button
                    onClick={() => navigate(`/history/${h.id || `attempt-${h.attemptId}`}`)}
                    className="px-3 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-sm font-semibold"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
