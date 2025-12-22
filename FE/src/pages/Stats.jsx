// src/pages/Stats.jsx
import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet } from "../lib/apiClient.js";

function unwrap(res) {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;
  return payload?.data ?? payload;
}

function parseDurationToSec(input) {
  if (input === null || input === undefined) return 0;
  const s = String(input).trim();
  if (!s) return 0;

  // 1) "Xm Ys" (định dạng BE demo)
  const m1 = /([0-9]+)\s*m/i.exec(s);
  const s1 = /([0-9]+)\s*s/i.exec(s);
  if (m1 || s1) {
    const mm = m1 ? Number(m1[1]) : 0;
    const ss = s1 ? Number(s1[1]) : 0;
    return mm * 60 + ss;
  }

  // 2) "X phút" / "X phút Y giây"
  const mp = /([0-9]+)\s*phút/i.exec(s);
  const sg = /([0-9]+)\s*giây/i.exec(s);
  if (mp || sg) {
    const mm = mp ? Number(mp[1]) : 0;
    const ss = sg ? Number(sg[1]) : 0;
    return mm * 60 + ss;
  }

  // 3) "HH:MM:SS" hoặc "MM:SS"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(":").map((x) => Number(x));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  // 4) fallback: number (giây)
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fmtSec(sec) {
  const x = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  const s = x % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0%";
  return `${Math.round(x)}%`;
}

function isCompletedStatus(st) {
  const t = String(st || "").toLowerCase();
  return ["completed", "finished", "done"].includes(t);
}

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default function Stats() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        // cố gắng lấy nhiều record để thống kê (BE có thể ignore query cũng không sao)
        const res = await apiGet("/history?page=1&limit=1000");
        if (!alive) return;
        const list = unwrap(res);
        setHistory(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Không tải được dữ liệu thống kê");
        setHistory([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const completed = useMemo(() => {
    return (history || []).filter((h) => isCompletedStatus(h?.status));
  }, [history]);

  const summary = useMemo(() => {
    const n = completed.length;
    const sumScore = completed.reduce((acc, x) => acc + num(x?.score), 0);
    const sumTotalScore = completed.reduce((acc, x) => acc + num(x?.totalScore ?? x?.totalQuestions), 0);

    const sumCorrect = completed.reduce((acc, x) => acc + num(x?.correct), 0);
    const sumTotalQ = completed.reduce((acc, x) => acc + num(x?.totalQuestions), 0);

    const sumDurSec = completed.reduce((acc, x) => acc + parseDurationToSec(x?.time), 0);

    const avgScore = n ? sumScore / n : 0;
    const avgTotalScore = n ? sumTotalScore / n : 0;
    const avgScorePct = sumTotalScore ? (sumScore / sumTotalScore) * 100 : 0;

    const accuracyPct = sumTotalQ ? (sumCorrect / sumTotalQ) * 100 : 0;
    const avgTimePerQ = sumTotalQ ? sumDurSec / sumTotalQ : 0;
    const avgTimePerTest = n ? sumDurSec / n : 0;

    // highest score
    let best = null;
    for (const a of completed) {
      const sc = num(a?.score);
      const ts = num(a?.totalScore ?? a?.totalQuestions);
      const pct = ts ? (sc / ts) * 100 : 0;
      if (!best || pct > best.pct) {
        best = {
          pct,
          score: sc,
          totalScore: ts,
          testName: a?.testName,
          date: a?.date,
        };
      }
    }

    return {
      testsDone: n,
      questionsDone: sumTotalQ,
      totalTimeSec: sumDurSec,
      avgScore,
      avgTotalScore,
      avgScorePct,
      accuracyPct,
      avgTimePerQ,
      avgTimePerTest,
      best,
    };
  }, [completed]);

  const recent3 = useMemo(() => {
    const list = [...completed];
    // ưu tiên sort theo date (nếu parse được), fallback theo id desc
    list.sort((a, b) => {
      const da = Date.parse(a?.date || a?.createdAt || "");
      const db = Date.parse(b?.date || b?.createdAt || "");
      if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return db - da;
      const ia = num(a?.id || a?.attemptId);
      const ib = num(b?.id || b?.attemptId);
      return ib - ia;
    });
    return list.slice(0, 3);
  }, [completed]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Thống kê</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tổng hợp kết quả làm bài của bạn (không còn dùng dữ liệu mock).
          </p>
        </div>

        {err ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
        ) : null}

        {/* OVERVIEW */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="text-xs font-semibold uppercase text-neutral-500">Điểm trung bình</div>
            <div className="mt-2 text-3xl font-bold">
              {loading ? "—" : `${Math.round(summary.avgScore)} / ${Math.round(summary.avgTotalScore) || 0}`}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {loading ? "" : `≈ ${fmtPct(summary.avgScorePct)} theo tổng điểm`}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="text-xs font-semibold uppercase text-neutral-500">Điểm cao nhất</div>
            <div className="mt-2 text-3xl font-bold">
              {loading || !summary.best
                ? "—"
                : `${Math.round(summary.best.score)} / ${Math.round(summary.best.totalScore) || 0}`}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {loading || !summary.best
                ? ""
                : `${summary.best.testName || ""}${summary.best.date ? ` • ${summary.best.date}` : ""}`}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="text-xs font-semibold uppercase text-neutral-500">Tổng quan</div>
            <div className="mt-2 text-3xl font-bold">{loading ? "—" : summary.testsDone}</div>
            <div className="mt-1 text-xs text-neutral-500">Số đề đã hoàn thành</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="text-xs font-semibold uppercase text-neutral-500">Tổng thời gian luyện</div>
            <div className="mt-2 text-3xl font-bold">{loading ? "—" : fmtSec(summary.totalTimeSec)}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {loading ? "" : `${summary.questionsDone} câu đã làm • Accuracy ${fmtPct(summary.accuracyPct)}`}
            </div>
          </div>
        </section>

        {/* RECENT 3 */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Chi tiết theo đề thi (3 đề gần nhất)</h2>
            <span className="text-xs text-neutral-500">Dựa trên lịch sử làm bài</span>
          </div>

          {loading ? (
            <div className="text-neutral-600">Đang tải...</div>
          ) : recent3.length === 0 ? (
            <div className="text-neutral-600">Chưa có bài làm nào để thống kê.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <div className="hidden md:grid grid-cols-12 bg-neutral-100 px-4 py-3 text-sm font-medium">
                <div className="col-span-4">Tên đề</div>
                <div className="col-span-2">Ngày làm</div>
                <div className="col-span-2">Điểm</div>
                <div className="col-span-2">Chính xác</div>
                <div className="col-span-2 text-right">Thời gian</div>
              </div>

              {recent3.map((a, i) => {
                const totalQ = num(a?.totalQuestions);
                const correct = num(a?.correct);
                const accPct = totalQ ? (correct / totalQ) * 100 : 0;
                return (
                  <div
                    key={a?.id || a?.attemptId || i}
                    className={`grid grid-cols-12 items-center px-4 py-4 text-sm ${
                      i !== recent3.length - 1 ? "border-b border-neutral-100" : ""
                    }`}
                  >
                    <div className="col-span-12 md:col-span-4">
                      <div className="font-medium">{a?.testName || `Test #${a?.testId || a?.id}`}</div>
                      <div className="md:hidden text-xs text-neutral-500 mt-1">
                        {a?.date || "-"} • {a?.score} / {a?.totalScore} • {fmtPct(accPct)} • {a?.time}
                      </div>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-neutral-700">{a?.date || "-"}</div>
                    <div className="hidden md:block md:col-span-2 text-neutral-700">
                      {a?.score} / {a?.totalScore}
                    </div>
                    <div className="hidden md:block md:col-span-2 text-neutral-700">{fmtPct(accPct)}</div>
                    <div className="hidden md:block md:col-span-2 text-right text-neutral-700">{a?.time || "-"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TIME & SPEED */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="text-sm font-semibold mb-2">Thống kê thời gian & tốc độ</h2>

            {loading ? (
              <div className="text-neutral-600">Đang tính toán...</div>
            ) : completed.length === 0 ? (
              <div className="text-neutral-600">Chưa có dữ liệu.</div>
            ) : (
              <div className="space-y-2 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span>Trung bình 1 câu làm trong</span>
                  <span className="font-semibold">{fmtSec(summary.avgTimePerQ)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trung bình 1 đề làm hết</span>
                  <span className="font-semibold">{fmtSec(summary.avgTimePerTest)}</span>
                </div>
                <div className="pt-2 text-xs text-neutral-500">
                  Tổng thời gian luyện: <b>{fmtSec(summary.totalTimeSec)}</b>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="text-sm font-semibold mb-2">Thống kê khối lượng</h2>
            {loading ? (
              <div className="text-neutral-600">Đang tính toán...</div>
            ) : (
              <div className="space-y-2 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span>Số đề đã hoàn thành</span>
                  <span className="font-semibold">{summary.testsDone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số câu đã làm</span>
                  <span className="font-semibold">{summary.questionsDone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Độ chính xác (tổng)</span>
                  <span className="font-semibold">{fmtPct(summary.accuracyPct)}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PLACEHOLDERS */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Độ chính xác theo kỹ năng</h2>
              <span className="text-xs text-neutral-500">(tạm để trống)</span>
            </div>
            <div className="h-40 grid place-items-center text-neutral-400 text-sm">Chưa có dữ liệu biểu đồ</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Tiến độ theo thời gian</h2>
              <span className="text-xs text-neutral-500">(tạm để trống)</span>
            </div>
            <div className="h-40 grid place-items-center text-neutral-400 text-sm">Chưa có dữ liệu biểu đồ</div>
          </div>
        </section>
      </main>
    </div>
  );
}
