// src/pages/FeedbackDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPatch } from "../lib/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";

function unwrap(payload) {
  return payload?.data ?? payload;
}

export default function FeedbackDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [fb, setFb] = useState(null);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [adminNote, setAdminNote] = useState("");

  const title = useMemo(() => {
    if (!fb) return `Feedback #${id}`;
    return `Feedback #${fb.id}`;
  }, [fb, id]);

  const fetchDetail = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await apiGet(`/feedback/${id}`);
      const data = unwrap(res);
      setFb(data);
      setStatus(data?.status || "open");
      setPriority(data?.priority || "medium");
      setAdminNote(data?.adminNote || "");
    } catch (e) {
      setErr(e?.message || "Không tải được chi tiết feedback");
      if (String(e?.message || "").toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!isAdmin) return;
    setErr("");
    setSaving(true);
    try {
      await apiPatch(`/feedback/${id}`, { status, priority, adminNote });
      await fetchDetail();
    } catch (e) {
      setErr(e?.message || "Cập nhật thất bại");
      if (String(e?.message || "").toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-4">
          <Link to="/feedback" className="text-emerald-700 hover:underline">
            ← Quay lại Feedback
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-4">{title}</h1>

        {err ? <div className="text-red-600 text-sm mb-4">{err}</div> : null}
        {loading ? <div className="text-sm text-neutral-600">Đang tải...</div> : null}

        {!loading && fb ? (
          <section className="border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-semibold">#{fb.id}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <div className="text-xs text-neutral-600 flex gap-2 flex-wrap">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5">type: {fb.type}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5">status: {fb.status}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5">priority: {fb.priority}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">testId</div>
                <div className="font-medium">{fb.testId ?? "-"}</div>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">questionId</div>
                <div className="font-medium">{fb.questionId ?? "-"}</div>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                <div className="text-xs text-neutral-500">attemptId</div>
                <div className="font-medium">{fb.attemptId ?? "-"}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">Nội dung</div>
              <div className="whitespace-pre-wrap text-sm text-neutral-800">{fb.message}</div>
            </div>

            {fb.adminNote ? (
              <div className="mt-5">
                <div className="text-sm font-semibold mb-2">Admin note</div>
                <div className="whitespace-pre-wrap text-sm text-neutral-800">{fb.adminNote}</div>
              </div>
            ) : null}
          </section>
        ) : null}

        {isAdmin && fb ? (
          <section className="mt-6 border border-neutral-200 rounded-2xl p-6 bg-neutral-50">
            <h2 className="text-lg font-semibold mb-4">Admin cập nhật</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="open">open</option>
                  <option value="in_review">in_review</option>
                  <option value="resolved">resolved</option>
                  <option value="dismissed">dismissed</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Priority</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
            </div>

            <label className="block mt-4">
              <span className="block text-sm font-medium mb-1">Admin note</span>
              <textarea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Ghi chú xử lý..."
              />
            </label>

            <button
              onClick={save}
              disabled={saving}
              className="mt-4 w-full rounded-lg px-4 py-3 font-semibold transition bg-neutral-900 hover:bg-black text-white disabled:bg-neutral-400"
            >
              {saving ? "Đang lưu..." : "Lưu cập nhật"}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
