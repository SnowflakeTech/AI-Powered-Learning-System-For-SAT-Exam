// src/pages/HistoryDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet } from "../lib/apiClient.js";

function unwrap(res) {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;
  return payload?.data ?? payload;
}

export default function HistoryDetail() {
  const { attemptId } = useParams(); // "attempt-1" hoặc "1"
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await apiGet(`/history/${attemptId}`);
        setAttempt(unwrap(res) || null);
      } catch (e) {
        setErr(e?.message || "Không tải được chi tiết bài làm");
        setAttempt(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  const accuracy = useMemo(() => {
    const correct = Number(attempt?.correct ?? 0);
    const total = Number(attempt?.totalQuestions ?? 0) || 0;
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }, [attempt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-10 text-neutral-600">
          Đang tải chi tiết...
        </main>
      </div>
    );
  }

  if (err || !attempt) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {err || "Không tìm thấy bài làm"}
          </div>
          <button
            onClick={() => navigate("/history")}
            className="mt-4 px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs md:text-sm"
          >
            ← Quay lại lịch sử
          </button>
        </main>
      </div>
    );
  }

  const questions = Array.isArray(attempt.questions) ? attempt.questions : [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Kết quả bài làm</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {attempt.testName} • Ngày làm: {attempt.date || "-"}
            </p>
          </div>
          <button
            onClick={() => navigate("/history")}
            className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs md:text-sm"
          >
            ← Quay lại lịch sử
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <div className="text-xs text-neutral-500">Score</div>
            <div className="text-2xl font-bold mt-1">
              {attempt.score} / {attempt.totalScore}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <div className="text-xs text-neutral-500">Correct</div>
            <div className="text-2xl font-bold mt-1">
              {attempt.correct} / {attempt.totalQuestions}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <div className="text-xs text-neutral-500">Accuracy</div>
            <div className="text-2xl font-bold mt-1">{accuracy}%</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <div className="text-xs text-neutral-500">Time</div>
            <div className="text-2xl font-bold mt-1">{attempt.time}</div>
          </div>
        </div>

        {/* Questions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Chi tiết câu trả lời</h2>

          {!questions.length ? (
            <p className="text-sm text-neutral-600">
              Chưa có dữ liệu câu hỏi chi tiết cho bài này.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              {questions.map((q) => {
                const isCorrect = q.chosenIndex === q.correctIndex;
                const qText = q.question ?? q.content ?? "";
                return (
                  <div
                    key={q.no}
                    className={`border rounded-md px-3 py-2 ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-red-200 bg-red-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold">
                        Câu {q.no}: <span className="font-normal">{qText}</span>
                      </div>
                      <span className={`text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                        {isCorrect ? "ĐÚNG" : "SAI"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1">
                      {(q.options || []).map((opt, idx) => {
                        const isChosen = idx === q.chosenIndex;
                        const isAns = idx === q.correctIndex;
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded-md border ${
                              isAns
                                ? "border-emerald-300 bg-emerald-50"
                                : isChosen
                                  ? "border-red-300 bg-red-50"
                                  : "border-neutral-200 bg-white"
                            }`}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2 text-xs text-neutral-600">
                      Topic: {q.topic || "-"} • Difficulty: {q.difficulty || "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
