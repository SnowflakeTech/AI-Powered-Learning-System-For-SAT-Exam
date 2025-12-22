
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function DashboardNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/dashboard",  label: "Màn hình chính" },
    { to: "/tests",      label: "Bài thi" },
    { to: "/tro-ly-hoc-tap", label: "Trợ lý học tập" },
    { to: "/history",    label: "Lịch sử làm bài" } ,
    { to: "/stats",      label: "Thống kê" },
    { to: "/feedback",   label: "Phản hồi" },
  ];

  const activeCls = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm transition ${
      isActive ? "bg-white/15 text-white"
               : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = async () => {
    await logout?.();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-green-700 text-white border-b border-green-800/70">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="font-semibold tracking-tight">
          Hệ thống đề thi HSA
        </Link>

        {/* Nav links (desktop) */}
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
                // Dashboard cần end để không bị active trên các path con
                end={l.to === "/dashboard"}
              >
                {l.label}
              </NavLink>
            )
          )}
        </nav>

        {/* User menu */}
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
              className="absolute right-0 mt-2 w-48 rounded-lg bg-white text-green-900 shadow-lg ring-1 ring-black/10 overflow-hidden"
              onMouseLeave={() => setOpen(false)}
              role="menu"
            >
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

      {/* Nav (mobile) */}
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
