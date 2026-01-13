import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import DashboardNavBar from "../components/DashboardNavBar.jsx";
import { apiGet } from "../lib/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";

function toDateKey(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function TraCuu() {
  const { user } = useAuth();

  const [tab, setTab] = useState("SAT");

  const [satLoading, setSatLoading] = useState(false);
  const [satErr, setSatErr] = useState("");
  const [satDates, setSatDates] = useState([]);
  const [satSource, setSatSource] = useState("");

  const [hsaLoading, setHsaLoading] = useState(false);
  const [hsaErr, setHsaErr] = useState("");
  const [hsaRows, setHsaRows] = useState([]);
  const [hsaSource, setHsaSource] = useState("");

  const [country, setCountry] = useState("Vietnam");
  const [city, setCity] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const loadSat = async () => {
      setSatLoading(true);
      setSatErr("");
      try {
        const res = await apiGet("/lookup/sat/dates");
        const root = res?.data ?? res;
        const inner = root?.data ?? root;
        setSatDates(Array.isArray(inner?.dates) ? inner.dates : []);
        setSatSource(String(inner?.sourceUrl || ""));
      } catch (e) {
        setSatErr(e?.message || "Không tải được lịch SAT");
      } finally {
        setSatLoading(false);
      }
    };

    const loadHsa = async () => {
      setHsaLoading(true);
      setHsaErr("");
      try {
        const res = await apiGet("/lookup/hsa/schedule");
        const root = res?.data ?? res;
        const inner = root?.data ?? root;
        setHsaRows(Array.isArray(inner?.rows) ? inner.rows : []);
        setHsaSource(String(inner?.sourceUrl || ""));
      } catch (e) {
        setHsaErr(e?.message || "Không tải được lịch HSA");
      } finally {
        setHsaLoading(false);
      }
    };

    loadSat();
    loadHsa();
  }, []);

  const satFiltered = useMemo(() => {
    const f = toDateKey(fromDate);
    const t = toDateKey(toDate);
    return (satDates || []).filter((x) => {
      const dk = toDateKey(x?.testDate);
      if (f && dk && dk < f) return false;
      if (t && dk && dk > t) return false;
      return true;
    });
  }, [satDates, fromDate, toDate]);

  const hsaFiltered = useMemo(() => {
    const k = String(keyword || "").trim().toLowerCase();
    const loc = String(location || "").trim().toLowerCase();
    const f = toDateKey(fromDate);
    const t = toDateKey(toDate);

    return (hsaRows || []).filter((r) => {
      const text = `${r?.round || ""} ${r?.location || ""} ${r?.note || ""}`.toLowerCase();

      if (k && !text.includes(k)) return false;
      if (loc && !String(r?.location || "").toLowerCase().includes(loc)) return false;

      const dk = toDateKey(r?.date);
      if (f && dk && dk < f) return false;
      if (t && dk && dk > t) return false;

      return true;
    });
  }, [hsaRows, keyword, location, fromDate, toDate]);

  const testCenterUrl = useMemo(() => {
    const c = encodeURIComponent(country || "");
    const ci = encodeURIComponent(city || "");
    return `https://satsuite.collegeboard.org/sat/test-center-search?country=${c}&city=${ci}`;
  }, [country, city]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {user ? <DashboardNavBar /> : <Navbar />}

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Tra cứu lịch thi SAT/HSA</h1>
            <div className="mt-1 text-sm text-neutral-600">
              Lịch được cập nhật từ nguồn chính thức và cache theo thời gian.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("SAT")}
              className={
                "px-4 py-2 rounded-xl border text-sm font-semibold " +
                (tab === "SAT"
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white border-neutral-200 hover:bg-neutral-50")
              }
            >
              SAT
            </button>
            <button
              onClick={() => setTab("HSA")}
              className={
                "px-4 py-2 rounded-xl border text-sm font-semibold " +
                (tab === "HSA"
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white border-neutral-200 hover:bg-neutral-50")
              }
            >
              HSA
            </button>
          </div>
        </div>

        <div className="mt-5 bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="block">
              <div className="text-sm font-medium mb-1">Từ ngày</div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Đến ngày</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </label>

            {tab === "SAT" ? (
              <>
                <label className="block">
                  <div className="text-sm font-medium mb-1">Country</div>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="Vietnam"
                  />
                </label>
                <label className="block">
                  <div className="text-sm font-medium mb-1">City</div>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="Hanoi"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <div className="text-sm font-medium mb-1">Địa điểm</div>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="Hà Nội, Hải Phòng..."
                  />
                </label>
                <label className="block">
                  <div className="text-sm font-medium mb-1">Từ khoá</div>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="Đợt, mã, ghi chú..."
                  />
                </label>
              </>
            )}
          </div>

          {tab === "SAT" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={testCenterUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-sm font-semibold"
              >
                Tìm điểm thi SAT (official)
              </a>
              {satSource ? (
                <a
                  href={satSource}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold"
                >
                  Nguồn SAT Dates/Deadlines
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hsaSource ? (
                <a
                  href={hsaSource}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold"
                >
                  Nguồn lịch HSA
                </a>
              ) : null}
            </div>
          )}
        </div>

        {tab === "SAT" ? (
          <div className="mt-5 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-neutral-100 text-sm font-semibold">
              Lịch SAT
            </div>

            {satErr ? (
              <div className="p-4 text-red-700">{satErr}</div>
            ) : satLoading ? (
              <div className="p-4 text-neutral-600">Đang tải...</div>
            ) : satFiltered.length === 0 ? (
              <div className="p-4 text-neutral-600">Không có dữ liệu phù hợp.</div>
            ) : (
              satFiltered.map((x, idx) => (
                <div
                  key={`${x.testDate}-${idx}`}
                  className="px-4 py-4 border-t border-neutral-100"
                >
                  <div className="font-semibold">{x.testDate || "N/A"}</div>
                  <div className="mt-1 text-sm text-neutral-700">
                    Registration: {x.registrationDeadline || "N/A"} • Late:{" "}
                    {x.lateRegistrationDeadline || "N/A"}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-5 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-neutral-100 text-sm font-semibold">
              Lịch HSA
            </div>

            {hsaErr ? (
              <div className="p-4 text-red-700">{hsaErr}</div>
            ) : hsaLoading ? (
              <div className="p-4 text-neutral-600">Đang tải...</div>
            ) : hsaFiltered.length === 0 ? (
              <div className="p-4 text-neutral-600">Không có dữ liệu phù hợp.</div>
            ) : (
              hsaFiltered.map((r, idx) => (
                <div
                  key={`${r.round}-${r.date}-${idx}`}
                  className="px-4 py-4 border-t border-neutral-100"
                >
                  <div className="font-semibold">
                    {r.round || "Đợt"} • {r.date || "N/A"}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    Địa điểm: {r.location || "N/A"}
                  </div>
                  {r.note ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      Ghi chú: {r.note}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
