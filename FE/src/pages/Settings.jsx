import React, { useMemo, useState } from "react";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useLanguage } from "../routes/LanguageProvider.jsx";
import { apiPatch } from "../lib/apiClient.js";
import { t } from "../routes/i18n.js";

function fmtDateTime(x) {
  if (!x) return "-";
  try {
    return new Date(x).toLocaleString();
  } catch {
    return "-";
  }
}

function detectDevice(uaRaw) {
  const ua = String(uaRaw || "");
  if (!ua) return { name: "-", detail: "-" };

  const isWindows = ua.includes("Windows");
  const isMac = ua.includes("Macintosh");
  const isLinux = ua.includes("Linux") && !ua.includes("Android");
  const isAndroid = ua.includes("Android");
  const isiOS = ua.includes("iPhone") || ua.includes("iPad");

  let os = "Unknown";
  if (isWindows) os = "Windows";
  else if (isMac) os = "macOS";
  else if (isiOS) os = "iOS";
  else if (isAndroid) os = "Android";
  else if (isLinux) os = "Linux";

  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";

  const detail = ua.length > 80 ? ua.slice(0, 80) + "..." : ua;

  return { name: `${browser} • ${os}`, detail };
}

export default function Settings() {
  const { user } = useAuth();
  const { lang, setLang } = useLanguage();

  const [pw, setPw] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const displayName = useMemo(() => {
    return user?.name || user?.username || user?.email || "User";
  }, [user]);

  const initials = useMemo(() => {
    const s = String(user?.name || user?.username || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [user]);

  const device = useMemo(() => detectDevice(user?.lastLoginUa), [user]);

  const canSubmit = useMemo(() => {
    if (!pw.oldPassword || !pw.newPassword || !pw.confirmPassword) return false;
    if (pw.newPassword.length < 6) return false;
    if (pw.newPassword !== pw.confirmPassword) return false;
    return true;
  }, [pw]);

  const updatePassword = async () => {
    setOk("");
    setErr("");
    if (!canSubmit) return;

    setSaving(true);
    try {
      await apiPatch("/user/change-password", {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      });
      setOk(lang === "en" ? "Password updated." : "Đã cập nhật mật khẩu.");
      setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setErr(e?.message || (lang === "en" ? "Update failed" : "Cập nhật mật khẩu thất bại"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{t(lang, "settings.title")}</h1>
          <p className="text-neutral-600 mt-1">{t(lang, "settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{displayName}</div>
                <div className="text-sm text-neutral-600 truncate">{user?.email || ""}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-neutral-600">{t(lang, "settings.role")}</div>
                <div className="font-semibold">{user?.role || "student"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-600">{t(lang, "settings.userId")}</div>
                <div className="font-semibold">{user?.uid || "-"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-600">{t(lang, "settings.createdAt")}</div>
                <div className="font-semibold">{fmtDateTime(user?.createdAt)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-600">{t(lang, "settings.lastLoginAt")}</div>
                <div className="font-semibold">{fmtDateTime(user?.lastLoginAt)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-600">{t(lang, "settings.lastLoginIp")}</div>
                <div className="font-semibold">{user?.lastLoginIp || "-"}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-semibold">{t(lang, "settings.lastDevice")}</div>
              <div className="mt-2 text-sm text-neutral-800 font-semibold">{device.name}</div>
              <div className="mt-2 text-xs text-neutral-600">{device.detail}</div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-semibold">{t(lang, "settings.aboutTitle")}</div>
              <div className="mt-2 text-sm text-neutral-700">{t(lang, "settings.aboutText")}</div>
              <div className="mt-2 text-xs text-neutral-600">{t(lang, "settings.authors")}</div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-neutral-200 p-5">
                <div className="text-lg font-semibold">{t(lang, "settings.display")}</div>
                <div className="text-sm text-neutral-600 mt-1">{t(lang, "settings.savedLangHint")}</div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">{t(lang, "settings.language")}</div>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  >
                    <option value="vi">VI - Tiếng Việt</option>
                    <option value="en">EN - English</option>
                    <option value="ja">JA - 日本語</option>
                    <option value="ko">KO - 한국어</option>
                    <option value="zh">ZH - 中文</option>
                    <option value="fr">FR - Français</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-5">
                <div className="text-lg font-semibold">{t(lang, "settings.security")}</div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">{t(lang, "settings.currentPassword")}</div>
                    <input
                      type="password"
                      value={pw.oldPassword}
                      onChange={(e) => setPw((p) => ({ ...p, oldPassword: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">{t(lang, "settings.newPassword")}</div>
                    <input
                      type="password"
                      value={pw.newPassword}
                      onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                    />
                    <div className="mt-1 text-xs text-neutral-500">{t(lang, "settings.passwordHint")}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">{t(lang, "settings.confirmPassword")}</div>
                    <input
                      type="password"
                      value={pw.confirmPassword}
                      onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  {err ? <div className="text-sm text-red-600">{err}</div> : null}
                  {ok ? <div className="text-sm text-emerald-700">{ok}</div> : null}

                  <button
                    onClick={updatePassword}
                    disabled={!canSubmit || saving}
                    className={
                      "mt-1 px-4 py-2 rounded-xl font-semibold transition " +
                      (!canSubmit || saving
                        ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                        : "bg-green-700 text-white hover:bg-green-800")
                    }
                  >
                    {saving ? (lang === "en" ? "Updating..." : "Đang cập nhật...") : t(lang, "settings.updatePassword")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="text-sm font-semibold">{t(lang, "settings.infoTitle")}</div>
              <div className="mt-2 text-sm text-neutral-700">{t(lang, "settings.infoText")}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
