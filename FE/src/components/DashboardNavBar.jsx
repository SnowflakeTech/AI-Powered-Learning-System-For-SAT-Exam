import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useLanguage } from "../routes/LanguageProvider.jsx";

export default function DashboardNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { lang, setLang } = useLanguage();

  const links = [
    { to: "/dashboard", label: "Màn hình chính" },
    { to: "/tests", label: "Luyện theo đề thi" },
    { to: "/practice", label: "Luyện theo kỹ năng" },
    { to: "/tra-cuu", label: "Tra cứu" },
    { to: "/tro-ly-hoc-tap", label: "Trợ lý học tập" },
    { to: "/history", label: "Lịch sử làm bài" },
    { to: "/stats", label: "Thống kê" },
    { to: "/feedback", label: "Phản hồi" },
  ];

  const activeCls = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm transition ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = async () => {
    await logout?.();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-green-700 text-white border-b border-green-800/70">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/dashboard" className="font-semibold tracking-tight">
          Hệ thống đề thi HSA/SAT
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) =>
            l.disabled ? (
              <span
                key={l.label}
                className="px-3 py-2 rounded-md text-sm text-white/50 cursor-not-allowed"
                title="Sắp có"
              >
                {l.label}
              </span>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={activeCls}
                end={l.to === "/dashboard"}
              >
                {l.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="hidden sm:block rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="vi" className="text-black">VI</option>
            <option value="en" className="text-black">EN</option>
            <option value="ja" className="text-black">JA</option>
            <option value="ko" className="text-black">KO</option>
            <option value="zh" className="text-black">ZH</option>
            <option value="fr" className="text-black">FR</option>
          </select>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="hidden sm:inline text-sm">
                Xin chào, {user?.name || user?.email || "Bạn"}
              </span>
              <div className="h-6 w-6 rounded-full bg-white/70 text-green-800 grid place-items-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg bg-white text-green-900 shadow-lg ring-1 ring-black/10 overflow-hidden"
                onMouseLeave={() => setOpen(false)}
                role="menu"
              >
                <div className="sm:hidden px-3 py-2 border-b border-neutral-200">
                  <div className="text-xs text-neutral-500 mb-1">Language</div>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="vi">VI</option>
                    <option value="en">EN</option>
                    <option value="ja">JA</option>
                    <option value="ko">KO</option>
                    <option value="zh">ZH</option>
                    <option value="fr">FR</option>
                  </select>
                </div>

                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-green-50"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  Trang của tôi
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm hover:bg-green-50"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  Cài đặt
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-green-50"
                  role="menuitem"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-green-800/70">
        <div className="max-w-7xl mx-auto px-2 py-2 flex flex-wrap gap-1">
          {links.map((l) =>
            l.disabled ? (
              <span
                key={l.label}
                className="px-3 py-1.5 rounded-md text-sm text-white/60 bg-white/5"
              >
                {l.label}
              </span>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={activeCls}
                end={l.to === "/dashboard"}
              >
                {l.label}
              </NavLink>
            )
          )}
        </div>
      </div>
    </header>
  );
}
