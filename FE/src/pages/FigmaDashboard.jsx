import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const s = String(input || "");
  const m = /([0-9]+)\s*m/i.exec(s);
  const sec = /([0-9]+)\s*s/i.exec(s);
  const mm = m ? Number(m[1]) : 0;
  const ss = sec ? Number(sec[1]) : 0;
  return mm * 60 + ss;
}

function fmtOneDecimal(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.0";
  return x.toFixed(1);
}

export default function FigmaDashboard() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const goTests = () => navigate("/tests");
  const goExam = (id) => navigate(`/exam/${id}`);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [tRes, hRes, iRes] = await Promise.all([
          apiGet("/tests"),
          apiGet("/history"),
          apiGet("/ai/insights"),
        ]);
        if (!alive) return;

        const t = unwrap(tRes);
        const h = unwrap(hRes);
        const i = unwrap(iRes);

        setTests(Array.isArray(t) ? t : []);
        setHistory(Array.isArray(h) ? h : []);
        setInsights(i || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Không tải được dữ liệu Dashboard");
        setTests([]);
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
    return (history || []).filter((h) => String(h?.status || "").toLowerCase() === "completed");
  }, [history]);

  const stats = useMemo(() => {
    const n = completed.length;
    const totalScoreBase = 800;

    const sumScore = completed.reduce((acc, x) => acc + Number(x?.score || 0), 0);
    const avgScore = n ? Math.round(sumScore / n) : 0;

    const sumCorrect = completed.reduce((acc, x) => acc + Number(x?.correct || 0), 0);
    const sumTotalQ = completed.reduce((acc, x) => acc + Number(x?.totalQuestions || 0), 0);
    const accPct = sumTotalQ ? Math.round((sumCorrect / sumTotalQ) * 100) : 0;

    const sumDurSec = completed.reduce((acc, x) => acc + parseDurationToSec(x?.time), 0);
    const avgTimePerQ = sumTotalQ ? sumDurSec / sumTotalQ : 0;

    return {
      testsDone: n,
      avgScore,
      totalScoreBase,
      totalQuestionsDone: sumTotalQ,
      accuracyPct: accPct,
      avgTimePerQuestionSec: avgTimePerQ,
    };
  }, [completed]);

  const recommendedTest = useMemo(() => {
    return tests && tests.length ? tests[0] : null;
  }, [tests]);

  const topTests = useMemo(() => (tests || []).slice(0, 3), [tests]);

  const skillChart = useMemo(() => {
    const rows = Array.isArray(insights?.weakSkills) ? insights.weakSkills : [];
    const labels = rows.map((x) => String(x?.skill || "Unknown"));
    const values = rows.map((x) => Math.round(Number(x?.accuracy || 0) * 100));
    return {
      data: {
        labels,
        datasets: [{ label: "Độ chính xác (%)", data: values }],
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
    const rows = Array.isArray(insights?.recent3) ? insights.recent3.slice().reverse() : [];
    const labels = rows.map((x) => String(x?.date || x?.testName || "—"));
    const values = rows.map((x) => Number(x?.accuracyPercent || 0));
    return {
      data: {
        labels,
        datasets: [{ label: "Độ chính xác (%)", data: values, tension: 0.35 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100 } },
      },
    };
  }, [insights]);

  const hasSkillChart = useMemo(() => {
    return Array.isArray(insights?.weakSkills) && insights.weakSkills.length > 0;
  }, [insights]);

  const hasTimeChart = useMemo(() => {
    return Array.isArray(insights?.recent3) && insights.recent3.length > 0;
  }, [insights]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {err ? (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">{err}</div>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "ĐIỂM TRUNG BÌNH",
              value: loading ? "—" : `${stats.avgScore} / ${stats.totalScoreBase}`,
            },
            {
              label: "TỔNG CÂU ĐÃ LÀM",
              value: loading ? "—" : `${stats.totalQuestionsDone} câu`,
            },
            {
              label: "THỜI GIAN TB",
              value: loading ? "—" : `${fmtOneDecimal(stats.avgTimePerQuestionSec)}s / câu`,
            },
            {
              label: "ĐỘ CHÍNH XÁC / SỐ BÀI",
              value: loading ? "—" : `${stats.accuracyPct}% / ${stats.testsDone} bài`,
            },
          ].map((k, i) => (
            <div
              key={i}
              className="rounded-xl bg-white ring-1 ring-neutral-200 p-4 shadow-md transition hover:ring-neutral-300 hover:shadow-lg"
            >
              <div className="text-neutral-500 text-xs font-medium">{k.label}</div>
              <div className="mt-2 text-3xl font-bold text-neutral-900">{k.value}</div>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-white ring-1 ring-neutral-200 p-5 shadow-md transition hover:ring-neutral-300 hover:shadow-lg flex items-center justify-between">
          <div>
            <div className="text-neutral-500 text-sm">Bài thi gợi ý tiếp theo</div>
            <div className="text-lg font-semibold">
              {recommendedTest ? recommendedTest.title : "Chưa có đề thi"}
            </div>
            {recommendedTest ? (
              <div className="mt-1 text-xs text-neutral-500">
                {recommendedTest.mode} • {recommendedTest.quantities || 0} câu
              </div>
            ) : null}
          </div>
          <button
            onClick={() => (recommendedTest ? goExam(recommendedTest.id) : goTests())}
            disabled={!recommendedTest}
            className={`px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-300 ${
              recommendedTest
                ? "bg-neutral-900 text-white hover:bg-black"
                : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
            }`}
          >
            Bắt đầu ngay
          </button>
        </section>

        <section className="rounded-xl bg-white ring-1 ring-neutral-200 p-5 shadow-md">
          <h3 className="mb-3 text-neutral-700 font-semibold">Bài thi có sẵn</h3>

          {loading ? (
            <div className="text-neutral-600">Đang tải danh sách đề thi...</div>
          ) : topTests.length === 0 ? (
            <div className="text-neutral-600">
              Chưa có đề thi nào. Vào tab <b>Bài thi</b> để tạo/nhập đề.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topTests.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-white ring-1 ring-neutral-200 p-5 space-y-2 shadow-md transition hover:ring-neutral-300 hover:shadow-lg"
                >
                  <div className="font-semibold">{t.title || `Test #${t.id}`}</div>
                  <div className="text-sm text-neutral-500">
                    {t.mode} • {t.quantities || 0} câu
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => goExam(t.id)}
                      className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-sm font-semibold hover:bg-black focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    >
                      Làm bài
                    </button>
                    <button
                      onClick={goTests}
                      className="px-3 py-1.5 rounded-md bg-white text-neutral-900 text-sm ring-1 ring-neutral-300 hover:bg-neutral-50 hover:ring-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/60"
                    >
                      Xem danh sách
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-xl bg-white ring-1 ring-neutral-200 p-5 shadow-md">
            <div className="font-semibold mb-2 text-neutral-700">Độ chính xác theo kỹ năng</div>
            {loading ? (
              <div className="h-56 grid place-items-center text-neutral-400">Đang tải...</div>
            ) : hasSkillChart ? (
              <div className="h-56">
                <Bar data={skillChart.data} options={skillChart.options} />
              </div>
            ) : (
              <div className="h-56 grid place-items-center text-neutral-400">Chưa có dữ liệu kỹ năng.</div>
            )}
          </div>

          <div className="rounded-xl bg-white ring-1 ring-neutral-200 p-5 shadow-md">
            <div className="font-semibold mb-2 text-neutral-700">Tiến độ theo thời gian</div>
            {loading ? (
              <div className="h-56 grid place-items-center text-neutral-400">Đang tải...</div>
            ) : hasTimeChart ? (
              <div className="h-56">
                <Line data={timeChart.data} options={timeChart.options} />
              </div>
            ) : (
              <div className="h-56 grid place-items-center text-neutral-400">Chưa có dữ liệu theo thời gian.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
