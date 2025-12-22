// src/pages/Login.jsx
import React, { useState } from "react";
import { EyeIcon } from "@heroicons/react/24/solid";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();

  const [email, setEmail] = useState(state?.registeredEmail || "");
  const [pw, setPw] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !pw) {
      setErr("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      await login(email, pw); // gọi hàm login từ AuthProvider
      const dest = state?.from?.pathname || "/dashboard";
      nav(dest, { replace: true });
    } catch (e) {
      setErr(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <img
        src="/background.png"
        alt=""
        className="fixed inset-0 -z-10 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          document.documentElement.style.background =
            "linear-gradient(135deg,#4f46e5,#9333ea,#ec4899)";
        }}
      />
      {/* Overlay */}
      <div className="fixed inset-0 -z-10 bg-black/20" />

      {/* Nội dung */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-center">Đăng nhập</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base mt-2 bg-white"
                  placeholder="nhập email..."
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">Mật khẩu</label>
                <div className="relative mt-2">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="input-base pr-12 bg-white"
                    placeholder="nhập mật khẩu..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600"
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {err && <div className="text-sm text-red-600">{err}</div>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>

              <div className="text-center text-sm text-slate-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-emerald-600 font-medium underline-offset-2 hover:underline"
                >
                  Đăng ký
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
