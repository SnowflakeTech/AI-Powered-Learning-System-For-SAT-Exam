import React, { useMemo, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useLanguage } from "../routes/LanguageProvider.jsx";
import { t } from "../routes/i18n.js";

export default function DashboardNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { lang, setLang } = useLanguage();

  const links = useMemo(
    () => [
      { to: "/dashboard", key: "nav.dashboard" },
      { to: "/tests", key: "nav.tests" },
      { to: "/practice", key: "nav.practice" },
      { to: "/tra-cuu", key: "nav.lookup" },
      { to: "/tro-ly-hoc-tap", key: "nav.assistant" },
      { to: "/history", key: "nav.history" },
      { to: "/stats", key: "nav.stats" },
      { to: "/feedback", key: "nav.feedback" },
    ],
    []
  );

  const activeCls = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm transition ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  const displayName = useMemo(() => {
    return user?.name || user?.username || user?.email || "User";
  }, [user]);

  const initials = useMemo(() => {
    const n = String(user?.name || user?.username || "U").trim();
    return (n[0] || "U").toUpperCase();
  }, [user]);

  const authorsLine = useMemo(() => {
    if (lang === "en") return "Authors: Pham Son – Le Quoc Anh – Dang Sy Toan";
    return "Tác giả: Phạm Sơn – Lê Quốc Anh – Đặng Sỹ Toàn";
  }, [lang]);

  const handleLogout = async () => {
    await logout?.();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-green-700 text-white border-b border-green-800/70">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/dashboard" className="font-semibold tracking-tight">
            {lang === "en" ? "SAT/HSA Practice System" : "Hệ thống luyện thi HSA/SAT"}
          </Link>
          <div className="hidden sm:block text-xs text-white/80 truncate">{authorsLine}</div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={activeCls}
              end={l.to === "/dashboard"}
            >
              {t(lang, l.key)}
            </NavLink>
          ))}
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
                {t(lang, "nav.hello")}, {displayName}
              </span>
              <div className="h-7 w-7 rounded-full bg-white/70 text-green-800 grid place-items-center text-xs font-bold">
                {initials}
              </div>
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-neutral-900 shadow-lg ring-1 ring-black/10 overflow-hidden"
                onMouseLeave={() => setOpen(false)}
                role="menu"
              >
                <div className="px-4 py-3 border-b border-neutral-200">
                  <div className="text-sm font-semibold truncate">{displayName}</div>
                  <div className="text-xs text-neutral-500 truncate">{user?.email || ""}</div>
                </div>

                <div className="sm:hidden px-4 py-3 border-b border-neutral-200">
                  <div className="text-xs text-neutral-500 mb-1">{t(lang, "settings.language", "Language")}</div>
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
                  to="/settings"
                  className="block px-4 py-2 text-sm hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  {t(lang, "nav.settings")}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50"
                  role="menuitem"
                >
                  {t(lang, "nav.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-green-800/70">
        <div className="max-w-7xl mx-auto px-2 py-2 flex flex-wrap gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={activeCls}
              end={l.to === "/dashboard"}
            >
              {t(lang, l.key)}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
