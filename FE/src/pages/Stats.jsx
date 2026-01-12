import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet } from "../lib/apiClient.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

function unwrap(res) {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;
  return payload?.data ?? payload;
}

function parseDurationToSec(input) {
  if (input === null || input === undefined) return 0;
  const s = String(input).trim();
  if (!s) return 0;

  const m1 = /([0-9]+)\s*m/i.exec(s);
  const s1 = /([0-9]+)\s*s/i.exec(s);
  if (m1 || s1) {
    const mm = m1 ? Number(m1[1]) : 0;
    const ss = s1 ? Number(s1[1]) : 0;
    return mm * 60 + ss;
  }

  const mp = /([0-9]+)\s*phút/i.exec(s);
  const sg = /([0-9]+)\s*giây/i.exec(s);
  if (mp || sg) {
    const mm = mp ? Number(mp[1]) : 0;
    const ss = sg ? Number(sg[1]) : 0;
    return mm * 60 + ss;
  }

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(":").map((x) => Number(x));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

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

function toDateKey(x) {
  const s = String(x || "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );
}

export default function Stats() {
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [range, setRange] = useState("30");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [hRes, iRes] = await Promise.all([
          apiGet("/history?page=1&limit=1000"),
          apiGet("/ai/insights"),
        ]);
        if (!alive) return;

        const list = unwrap(hRes);
        const i = unwrap(iRes);

        setHistory(Array.isArray(list) ? list : []);
        setInsights(i || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Không tải được dữ liệu thống kê");
        setHistory([]);
        setInsights(null);
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

  const completedFiltered = useMemo(() => {
    const days = range === "all" ? null : Number(range);
    if (!days) return completed;

    const now = Date.now();
    const from = now - days * 24 * 60 * 60 * 1000;

    return completed.filter((x) => {
      const d = Date.parse(x?.date || x?.createdAt || "");
      if (!Number.isFinite(d)) return true;
      return d >= from;
    });
  }, [completed, range]);

  const summary = useMemo(() => {
    const n = completedFiltered.length;

    const sumScore = completedFiltered.reduce((acc, x) => acc + num(x?.score), 0);
    const sumTotalScore = completedFiltered.reduce(
      (acc, x) => acc + num(x?.totalScore ?? x?.totalQuestions),
      0
    );

    const sumCorrect = completedFiltered.reduce((acc, x) => acc + num(x?.correct), 0);
    const sumTotalQ = completedFiltered.reduce((acc, x) => acc + num(x?.totalQuestions), 0);

    const sumDurSec = completedFiltered.reduce((acc, x) => acc + parseDurationToSec(x?.time), 0);

    const avgScore = n ? sumScore / n : 0;
    const avgTotalScore = n ? sumTotalScore / n : 0;
    const avgScorePct = sumTotalScore ? (sumScore / sumTotalScore) * 100 : 0;

    const accuracyPct = sumTotalQ ? (sumCorrect / sumTotalQ) * 100 : 0;
    const avgTimePerQ = sumTotalQ ? sumDurSec / sumTotalQ : 0;
    const avgTimePerTest = n ? sumDurSec / n : 0;

    let best = null;
    for (const a of completedFiltered) {
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
  }, [completedFiltered]);

  const recent3 = useMemo(() => {
    const list = [...completedFiltered];
    list.sort((a, b) => {
      const da = Date.parse(a?.date || a?.createdAt || "");
      const db = Date.parse(b?.date || b?.createdAt || "");
      if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return db - da;
      const ia = num(a?.id || a?.attemptId);
      const ib = num(b?.id || b?.attemptId);
      return ib - ia;
    });
    return list.slice(0, 3);
  }, [completedFiltered]);

  const progressSeries = useMemo(() => {
    const list = [...completedFiltered];
    list.sort((a, b) => {
      const da = Date.parse(a?.date || a?.createdAt || "");
      const db = Date.parse(b?.date || b?.createdAt || "");
      if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return da - db;
      const ia = num(a?.id || a?.attemptId);
      const ib = num(b?.id || b?.attemptId);
      return ia - ib;
    });

    const maxPoints = range === "7" ? 10 : range === "30" ? 30 : 30;
    const last = list.slice(Math.max(0, list.length - maxPoints));

    const labels = last.map((x) => toDateKey(x?.date || x?.createdAt || ""));
    const values = last.map((x) => {
      const totalQ = num(x?.totalQuestions);
      const correct = num(x?.correct);
      return totalQ ? Math.round((correct / totalQ) * 100) : 0;
    });

    return { labels, values };
  }, [completedFiltered, range]);

  const skillChart = useMemo(() => {
    const rows = Array.isArray(insights?.weakSkills) ? insights.weakSkills : [];
    const labels = rows.map((x) => String(x?.skill || "Unknown"));
    const values = rows.map((x) => Math.round(Number(x?.accuracy || 0) * 100));

    return {
      data: {
        labels,
        datasets: [{ label: "Accuracy (%)", data: values }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100 } },
      },
    };
  }, [insights]);

  const timeChart = useMemo(() => {
    return {
      data: {
        labels: progressSeries.labels,
        datasets: [{ label: "Accuracy (%)", data: progressSeries.values, tension: 0.35 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100 } },
      },
    };
  }, [progressSeries]);

  const hasSkillChart = useMemo(() => {
    return Array.isArray(insights?.weakSkills) && insights.weakSkills.length > 0;
  }, [insights]);

  const hasTimeChart = useMemo(() => {
    return progressSeries.labels.length > 0;
  }, [progressSeries]);

  const titleRange = useMemo(() => {
    if (range === "7") return "7 ngày";
    if (range === "30") return "30 ngày";
    return "Tất cả";
  }, [range]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Thống kê</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Tổng hợp kết quả làm bài theo khoảng thời gian bạn chọn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="7">7 ngày</option>
              <option value="30">30 ngày</option>
              <option value="all">Tất cả</option>
            </select>
            <div className="text-xs text-neutral-500 px-3 py-2 rounded-xl border border-neutral-200 bg-white">
              Đang xem: <b>{titleRange}</b>
            </div>
          </div>
        </div>

        {err ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard
            label="Điểm trung bình"
            value={loading ? "—" : `${Math.round(summary.avgScore)} / ${Math.round(summary.avgTotalScore) || 0}`}
            sub={loading ? "" : `≈ ${fmtPct(summary.avgScorePct)} theo tổng điểm`}
          />
          <KpiCard
            label="Điểm cao nhất"
            value={
              loading || !summary.best
                ? "—"
                : `${Math.round(summary.best.score)} / ${Math.round(summary.best.totalScore) || 0}`
            }
            sub={
              loading || !summary.best
                ? ""
                : `${summary.best.testName || ""}${summary.best.date ? ` • ${summary.best.date}` : ""}`
            }
          />
          <KpiCard label="Số bài hoàn thành" value={loading ? "—" : summary.testsDone} sub="Tổng số đề đã hoàn thành" />
          <KpiCard
            label="Tổng thời gian luyện"
            value={loading ? "—" : fmtSec(summary.totalTimeSec)}
            sub={loading ? "" : `${summary.questionsDone} câu • Accuracy ${fmtPct(summary.accuracyPct)}`}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">3 bài gần nhất</h2>
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

        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="text-sm font-semibold mb-2">Thời gian & tốc độ</h2>
            {loading ? (
              <div className="text-neutral-600">Đang tính toán...</div>
            ) : completedFiltered.length === 0 ? (
              <div className="text-neutral-600">Chưa có dữ liệu.</div>
            ) : (
              <div className="space-y-2 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span>TB 1 câu</span>
                  <span className="font-semibold">{fmtSec(summary.avgTimePerQ)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>TB 1 đề</span>
                  <span className="font-semibold">{fmtSec(summary.avgTimePerTest)}</span>
                </div>
                <div className="pt-2 text-xs text-neutral-500">
                  Tổng thời gian: <b>{fmtSec(summary.totalTimeSec)}</b>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <h2 className="text-sm font-semibold mb-2">Khối lượng</h2>
            {loading ? (
              <div className="text-neutral-600">Đang tính toán...</div>
            ) : (
              <div className="space-y-2 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span>Số đề hoàn thành</span>
                  <span className="font-semibold">{summary.testsDone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số câu đã làm</span>
                  <span className="font-semibold">{summary.questionsDone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accuracy (tổng)</span>
                  <span className="font-semibold">{fmtPct(summary.accuracyPct)}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Độ chính xác theo kỹ năng</div>
                <div className="text-xs text-neutral-500 mt-1">Top kỹ năng bạn cần cải thiện (từ lịch sử gần đây).</div>
              </div>
              <div className="text-xs text-neutral-500">{hasSkillChart ? "" : "Chưa có dữ liệu"}</div>
            </div>

            {loading ? (
              <div className="h-56 grid place-items-center text-neutral-400 text-sm">Đang tải...</div>
            ) : hasSkillChart ? (
              <div className="h-56 mt-2">
                <Bar data={skillChart.data} options={skillChart.options} />
              </div>
            ) : (
              <div className="h-56 grid place-items-center text-neutral-400 text-sm">
                Làm thêm vài bài để hệ thống tạo thống kê kỹ năng.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Tiến độ theo thời gian</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Accuracy theo các lần làm gần nhất trong {titleRange}.
                </div>
              </div>
              <div className="text-xs text-neutral-500">{hasTimeChart ? "" : "Chưa có dữ liệu"}</div>
            </div>

            {loading ? (
              <div className="h-56 grid place-items-center text-neutral-400 text-sm">Đang tải...</div>
            ) : hasTimeChart ? (
              <div className="h-56 mt-2">
                <Line data={timeChart.data} options={timeChart.options} />
              </div>
            ) : (
              <div className="h-56 grid place-items-center text-neutral-400 text-sm">
                Chưa có dữ liệu biểu đồ.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
