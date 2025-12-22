import React, { useState } from "react";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { apiPatch } from "../lib/apiClient.js";

export default function Settings() {
  const { user } = useAuth(); // {email, name, ...} từ AuthProvider
  const [curr, setCurr] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [nextPw2, setNextPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const submitChange = async (e) => {
    e.preventDefault();
    setOk(""); setErr("");
    if (!curr || !nextPw || !nextPw2) return setErr("Vui lòng điền đủ thông tin.");
    if (nextPw !== nextPw2) return setErr("Mật khẩu mới nhập lại không khớp.");
    setLoading(true);
    try {
      // Gọi API đổi mật khẩu (chỉnh endpoint)
      const res = await apiPatch("/user/change-password", {
        oldPassword: curr,
        newPassword: nextPw,
      });
      setOk(res?.message || 'Đổi mật khẩu thành công.');
        setCurr(''); setNextPw(''); setNextPw2('');
    } catch (e2) {
      setErr(e2.message || "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        {/* Thông tin tài khoản */}
        <section className="lg:col-span-1 rounded-xl bg-white ring-1 ring-neutral-200 p-6 shadow-md">
          <h1 className="text-xl font-bold mb-4">Thông tin tài khoản</h1>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-bold">
              {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{user?.name || "Chưa đặt tên"}</div>
              <div className="text-sm text-neutral-600">{user?.email}</div>
            </div>
          </div>

          {/* Có thể hiển thị thêm metadata khác nếu backend trả về */}
          {/* <div className="mt-4 text-sm text-neutral-600">Role: {user?.role}</div> */}
        </section>

        {/* Đổi mật khẩu */}
        <section className="lg:col-span-2 rounded-xl bg-white ring-1 ring-neutral-200 p-6 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Đổi mật khẩu</h2>
          <form onSubmit={submitChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm text-neutral-600">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={curr}
                onChange={(e) => setCurr(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600">Mật khẩu mới</label>
              <input
                type="password"
                value={nextPw}
                onChange={(e) => setNextPw(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600">Nhập lại mật khẩu mới</label>
              <input
                type="password"
                value={nextPw2}
                onChange={(e) => setNextPw2(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="••••••••"
              />
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}
            {ok && <div className="text-sm text-emerald-600">{ok}</div>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-70"
            >
              {loading ? "Đang lưu…" : "Cập nhật mật khẩu"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
