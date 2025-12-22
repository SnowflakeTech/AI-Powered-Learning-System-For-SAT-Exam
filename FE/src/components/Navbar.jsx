
import React from "react";
import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm transition ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-green-700 text-white border-b border-green-800/70">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand (logo + tên) */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.webp"
            alt="logo"
            className="h-10 w-10 object-contain"
          />
          <span className="hidden sm:inline font-semibold tracking-tight">
            Hệ thống đề thi HSA
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" end className={linkCls}>
            Trang chủ
          </NavLink>
          <NavLink to="/huong-dan" className={linkCls}>
            Hướng dẫn
          </NavLink>
          <NavLink to="/tra-cuu" className={linkCls}>
            Tra cứu
          </NavLink>
          {/* Trước khi đăng nhập: ẩn tab Trợ lý học tập */}
        </nav>

        {/* Auth buttons */}
        <div className="hidden sm:flex gap-2">
          <Link
            to="/login"
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition"
          >
            Đăng ký
          </Link>
        </div>
      </div>

      {/* Nav (mobile) */}
      <div className="md:hidden border-t border-green-800/70">
        <div className="max-w-7xl mx-auto px-2 py-2 flex flex-wrap gap-1">
          <NavLink to="/" end className={linkCls}>
            Trang chủ
          </NavLink>
          <NavLink to="/huong-dan" className={linkCls}>
            Hướng dẫn
          </NavLink>
          <NavLink to="/tra-cuu" className={linkCls}>
            Tra cứu
          </NavLink>
          {/* Trước khi đăng nhập: ẩn tab Trợ lý học tập */}
          <Link
            to="/login"
            className="px-3 py-2 rounded-md text-sm bg-white text-green-800 font-semibold"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-3 py-2 rounded-md text-sm bg-white text-green-800 font-semibold"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  );
}

