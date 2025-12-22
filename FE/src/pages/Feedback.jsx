// src/pages/Feedback.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPost } from "../lib/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";

const TYPE_OPTIONS = [
  { value: "wrong_answer", label: "Sai đáp án" },
  { value: "invalid_question", label: "Câu vô lý / sai đề" },
  { value: "too_hard", label: "Quá khó" },
  { value: "bug", label: "Bug hệ thống" },
  { value: "other", label: "Khác" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

function unwrap(payload) {
  // BE chuẩn: { success, data }
  return payload?.data ?? payload;
}

function toMaybeNumber(v) {
  const t = String(v ?? "").trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : t; // attemptId có thể là string kiểu attempt-1
}

export default function Feedback() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    type: "wrong_answer",
    priority: "medium",
    message: "",
    testId: "",
    questionId: "",
    attemptId: "",
  });

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const pages = useMemo(() => {
    const p = Math.ceil((total || 0) / limit);
    return p || 1;
  }, [total, limit]);

  const fetchMine = async (p = page) => {
    setErr("");
    setLoading(true);
    try {
      const endpoint = isAdmin ? `/feedback?page=${p}&limit=${limit}` : `/feedback/me?page=${p}&limit=${limit}`;
      const res = await apiGet(endpoint);
      const data = unwrap(res);
      setItems(data?.items || []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setErr(e?.message || "Không tải được danh sách feedback");
      if (String(e?.message || "").toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin]);

  const onChange = (k) => (e) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const disabled = useMemo(() => {
    return submitting || !form.message.trim();
  }, [submitting, form.message]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;

    setSubmitting(true);
    setOk("");
    setErr("");
    try {
      const payload = {
        type: form.type,
        priority: form.priority,
        message: form.message.trim(),
        testId: toMaybeNumber(form.testId),
        questionId: toMaybeNumber(form.questionId),
        attemptId: toMaybeNumber(form.attemptId),
      };
      // remove undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      await apiPost("/feedback", payload);
      setOk("Đã gửi phản hồi. Cảm ơn bạn!");
      setForm((p) => ({ ...p, message: "", testId: "", questionId: "", attemptId: "" }));
      setPage(1);
      await fetchMine(1);
    } catch (e2) {
      setErr(e2?.message || "Gửi phản hồi thất bại");
      if (String(e2?.message || "").toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Phản hồi hệ thống</h1>
          <p className="text-neutral-600 mt-1">
            Báo lỗi sai đáp án, câu hỏi vô lý, quá khó, hoặc các lỗi vặt khi dùng hệ thống.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FORM */}
          <section className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Gửi feedback</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Loại phản hồi</span>
                  <select
                    value={form.type}
                    onChange={onChange("type")}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {TYPE_OPTIONS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-sm font-medium mb-1">Ưu tiên</span>
                  <select
                    value={form.priority}
                    onChange={onChange("priority")}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {PRIORITY_OPTIONS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Nội dung</span>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={onChange("message")}
                  placeholder="Ví dụ: Đề SAT - Câu 3 sai đáp án (đúng phải là 15). Hoặc: Timer bị đứng khi chuyển câu..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Test ID (tuỳ chọn)</span>
                  <input
                    value={form.testId}
                    onChange={onChange("testId")}
                    placeholder="vd: 2"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Question ID (tuỳ chọn)</span>
                  <input
                    value={form.questionId}
                    onChange={onChange("questionId")}
                    placeholder="vd: 17"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Attempt ID (tuỳ chọn)</span>
                  <input
                    value={form.attemptId}
                    onChange={onChange("attemptId")}
                    placeholder="vd: 5"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
              </div>

              {err ? <div className="text-red-600 text-sm">{err}</div> : null}
              {ok ? <div className="text-emerald-700 text-sm">{ok}</div> : null}

              <button
                type="submit"
                disabled={disabled}
                className={`w-full rounded-lg px-4 py-3 font-semibold transition
                  ${
                    disabled
                      ? "bg-neutral-300 text-white/90 cursor-not-allowed"
                      : "bg-neutral-900 hover:bg-black text-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  }`}
              >
                {submitting ? "Đang gửi..." : "Gửi feedback"}
              </button>

              <div className="text-xs text-neutral-600">
                Gợi ý: nếu đang ở trang Lịch sử, bạn có thể lấy <b>attemptId</b> để report nhanh.
              </div>
            </form>
          </section>

          {/* LIST */}
          <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">{isAdmin ? "Tất cả feedback" : "Feedback của mình"}</h2>
              <button
                onClick={() => fetchMine(page)}
                disabled={loading}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              >
                {loading ? "Đang tải..." : "Refresh"}
              </button>
            </div>

            {loading ? <div className="text-sm text-neutral-600">Đang tải danh sách...</div> : null}

            {!loading && items.length === 0 ? (
              <div className="text-sm text-neutral-600">Chưa có feedback nào.</div>
            ) : (
              <div className="space-y-3">
                {items.map((fb) => (
                  <div
                    key={fb.id}
                    className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          #{fb.id} • {fb.type} •
                          <span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                            {fb.status}
                          </span>
                        </div>
                        {isAdmin ? (
                          <div className="text-xs text-neutral-600 mt-1">
                            From: <span className="font-medium">{fb?.user?.email || "(unknown)"}</span>
                          </div>
                        ) : null}
                        <div className="text-xs text-neutral-500 mt-1">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ""}
                        </div>
                      </div>

                      <Link
                        to={`/feedback/${fb.id}`}
                        className="text-sm text-emerald-700 hover:underline"
                      >
                        Chi tiết
                      </Link>
                    </div>

                    <div className="text-sm mt-2 text-neutral-800 whitespace-pre-wrap">
                      {String(fb.message || "").slice(0, 220)}
                      {String(fb.message || "").length > 220 ? "..." : ""}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-600">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5">priority: {fb.priority}</span>
                      {fb.testId ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5">testId: {fb.testId}</span>
                      ) : null}
                      {fb.questionId ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5">questionId: {fb.questionId}</span>
                      ) : null}
                      {fb.attemptId ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5">attemptId: {fb.attemptId}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-sm text-neutral-600">
                Page {page}/{pages}
              </div>
              <button
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
