import React, { useMemo } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  const isAuthPage = useMemo(() => {
    return pathname === "/login" || pathname === "/register";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-green-700 text-white border-b border-green-800/70">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.webp"
            alt="logo"
            className="h-10 w-10 object-contain shrink-0"
          />
          <div className="min-w-0 leading-tight">
            <div className="hidden sm:block font-semibold tracking-tight truncate">
              Hệ thống đề thi HSA/SAT
            </div>
            <div className="hidden sm:block text-xs text-white/80 truncate">
              Tác giả: Phạm Sơn - Lê Quốc Anh
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={linkCls}>
            Trang chủ
          </NavLink>
          <NavLink to="/huong-dan" className={linkCls}>
            Hướng dẫn
          </NavLink>
          <NavLink to="/tra-cuu" className={linkCls}>
            Tra cứu
          </NavLink>
          <NavLink to="/ve-chung-toi" className={linkCls}>
            Về chúng tôi
          </NavLink>
        </nav>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isAuthPage && pathname === "/login"
                ? "bg-white/90 text-black"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isAuthPage && pathname === "/register"
                ? "bg-white/90 text-black"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Đăng ký
          </Link>
        </div>
      </div>

      <div className="md:hidden border-t border-green-800/70">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-white/80 truncate">Tác giả: Phạm Sơn</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="px-3 py-2 rounded-md text-sm bg-white text-green-800 font-semibold hover:bg-gray-100 transition"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-3 py-2 rounded-md text-sm bg-white text-green-800 font-semibold hover:bg-gray-100 transition"
            >
              Đăng ký
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 pb-2 flex flex-wrap gap-1">
          <NavLink to="/" end className={linkCls}>
            Trang chủ
          </NavLink>
          <NavLink to="/huong-dan" className={linkCls}>
            Hướng dẫn
          </NavLink>
          <NavLink to="/tra-cuu" className={linkCls}>
            Tra cứu
          </NavLink>
          <NavLink to="/ve-chung-toi" className={linkCls}>
            Về chúng tôi
          </NavLink>
        </div>
      </div>
    </header>
  );
}
