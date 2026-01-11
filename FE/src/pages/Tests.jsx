import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiDelete, apiGet, apiPost } from "../lib/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import AiTestCreateModal from "../components/AiTestCreateModal.jsx";

export default function Tests() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await apiGet("/tests");
      setRows(res?.data || []);
    } catch (e) {
      setErr(e.message || "Không tải được danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const goExam = (id) => nav(`/exam/${id}`);
  const goCreate = () => nav("/admin/tests/new");
  const goEdit = (id) => nav(`/admin/tests/${id}/edit`);

  const deleteTest = async (id) => {
    if (!confirm(`Xoá hẳn đề thi #${id}?`)) return;
    try {
      await apiDelete(`/tests/${id}?deleteOrphans=true`);
      await load();
    } catch (e) {
      alert(e?.message || "Xoá đề thi thất bại");
    }
  };

  const submitAiCreate = async (payload) => {
    setAiLoading(true);
    setErr("");
    try {
      const res = await apiPost("/ai/generate-test", payload);
      const testId = res?.data?.testId;

      setAiOpen(false);
      await load();

      if (testId && confirm("Tạo đề AI thành công. Bạn muốn làm bài ngay không?")) {
        nav(`/exam/${testId}`);
      }
    } catch (e) {
      setErr(e?.message || "Tạo đề AI thất bại");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Danh sách đề thi</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiOpen(true)}
              className="px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600"
            >
              + Tạo đề AI
            </button>

            {isAdmin && (
              <button
                onClick={goCreate}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
              >
                + Tạo đề thi
              </button>
            )}
          </div>
        </div>

        {err && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {err}
          </div>
        )}

        <div className="mt-5 bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-neutral-100 text-sm font-medium">
            <div className="col-span-1">ID</div>
            <div className="col-span-5">Tiêu đề</div>
            <div className="col-span-2">Mode</div>
            <div className="col-span-2">Số câu</div>
            <div className="col-span-2 text-right">Hành động</div>
          </div>

          {loading ? (
            <div className="p-4 text-neutral-600">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-neutral-600">Chưa có đề thi nào.</div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-3 px-4 py-4 border-t border-neutral-100 items-center"
              >
                <div className="col-span-12 md:col-span-1 text-neutral-500">#{r.id}</div>

                <div className="col-span-12 md:col-span-5">
                  <div className="font-medium">{r.title || "Untitled Test"}</div>
                  <div className="mt-1 text-xs text-neutral-500 md:hidden">
                    {r.mode} • {r.quantities || 0} câu
                  </div>
                </div>

                <div className="hidden md:block md:col-span-2">{r.mode}</div>
                <div className="hidden md:block md:col-span-2">{r.quantities || 0}</div>

                <div className="col-span-12 md:col-span-2 flex justify-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => goExam(r.id)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Làm bài
                    </button>

                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => goEdit(r.id)}
                          className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteTest(r.id)}
                          className="px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
                        >
                          Xoá
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          * Nếu vào đường dẫn /api/v1 mà bị 404 là bình thường: NestJS chỉ trả 404 vì
          chưa có route GET &quot;/&quot;. Hãy test bằng Swagger hoặc gọi đúng endpoint
          (ví dụ: /api/v1/auth/login, /api/v1/tests).
        </p>
      </div>

      <AiTestCreateModal
        open={aiOpen}
        onClose={() => (!aiLoading ? setAiOpen(false) : null)}
        onSubmit={submitAiCreate}
        loading={aiLoading}
        isAdmin={isAdmin}
      />
    </div>
  );
}
