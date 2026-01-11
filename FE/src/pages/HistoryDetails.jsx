import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPost } from "../lib/apiClient.js";
import MathContent from "../components/MathContent.jsx";

function unwrap(res) {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;
  return payload?.data ?? payload;
}

function toLetter(idx) {
  if (idx === null || idx === undefined) return null;
  const n = Number(idx);
  if (!Number.isFinite(n) || n < 0 || n > 3) return null;
  return String.fromCharCode(65 + n);
}

function buildFeedbackUrl({ type, priority, message, testId, questionId, attemptId }) {
  const sp = new URLSearchParams();
  if (type) sp.set("type", String(type));
  if (priority) sp.set("priority", String(priority));
  if (message) sp.set("message", String(message));
  if (testId !== undefined && testId !== null && String(testId).trim()) sp.set("testId", String(testId));
  if (questionId !== undefined && questionId !== null && String(questionId).trim()) sp.set("questionId", String(questionId));
  if (attemptId !== undefined && attemptId !== null && String(attemptId).trim()) sp.set("attemptId", String(attemptId));
  return `/feedback?${sp.toString()}`;
}

export default function HistoryDetail() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [aiExplain, setAiExplain] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      setAttempt(null);
      setAiExplain(null);
      setAiSummary(null);
      setAiErr("");
      try {
        const res = await apiGet(`/history/${attemptId}`);
        setAttempt(unwrap(res) || null);
      } catch (e) {
        setErr(e?.message || "Không tải được chi tiết bài làm");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  const questions = useMemo(() => {
    const qs = Array.isArray(attempt?.questions) ? attempt.questions : [];
    return qs
      .slice()
      .sort((a, b) => (Number(a?.no || 0) || 0) - (Number(b?.no || 0) || 0));
  }, [attempt]);

  const accuracy = useMemo(() => {
    const correct = Number(attempt?.correct ?? 0);
    const total = Number(attempt?.totalQuestions ?? 0) || 0;
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }, [attempt]);

  const exam = useMemo(() => {
    const name = String(attempt?.testName || "").toLowerCase();
    if (name.includes("hsa")) return "HSA";
    return "SAT";
  }, [attempt]);

  const resolvedAttemptId = useMemo(() => {
    return attempt?.attemptId || attempt?.id || attemptId;
  }, [attempt, attemptId]);

  const resolvedTestId = useMemo(() => {
    return attempt?.testId || attempt?.test?.id || attempt?.test?.testId || null;
  }, [attempt]);

  const goFeedbackGeneral = () => {
    const url = buildFeedbackUrl({
      type: "bug",
      priority: "medium",
      message: `Báo lỗi bài làm ${attempt?.testName || ""} (attemptId=${resolvedAttemptId}). Mô tả: `,
      testId: resolvedTestId,
      attemptId: resolvedAttemptId,
    });
    navigate(url);
  };

  const goFeedbackQuestion = (qNo) => {
    const url = buildFeedbackUrl({
      type: "wrong_answer",
      priority: "medium",
      message: `Báo lỗi câu ${qNo} trong bài ${attempt?.testName || ""} (attemptId=${resolvedAttemptId}). Mô tả: `,
      testId: resolvedTestId,
      attemptId: resolvedAttemptId,
    });
    navigate(url);
  };

  useEffect(() => {
    const run = async () => {
      if (!attempt) return;
      if (!questions.length) return;

      setAiLoading(true);
      setAiErr("");

      try {
        const explainPayload = questions.map((q) => {
          const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
          const picked = toLetter(q.chosenIndex);
          const correct = toLetter(q.correctIndex) || "A";
          const key = `q-${resolvedAttemptId}-${q.no || Math.random()}`;

          return {
            tempKey: key,
            questionId: String(q.questionId || ""),
            content: q.content ?? q.question ?? "",
            choices: opts.map((t, i) => ({
              label: String.fromCharCode(65 + i),
              text: String(t ?? ""),
            })),
            picked,
            correct,
            skill: q.topic ?? null,
            difficulty: q.difficulty ?? null,
          };
        });

        const resExplain = await apiPost("/ai/explain-questions", {
          exam,
          questions: explainPayload,
        });

        const explainObj = unwrap(resExplain);
        setAiExplain(explainObj?.explanations || explainObj || null);

        const results = questions.map((q) => ({
          skill: q.topic ?? null,
          difficulty: q.difficulty ?? null,
          correct: Number(q.chosenIndex) === Number(q.correctIndex),
        }));

        const resSummary = await apiPost("/ai/practice-summary", {
          exam,
          results,
        });

        const summaryObj = unwrap(resSummary);
        setAiSummary(summaryObj || null);
      } catch (e) {
        setAiErr(e?.message || "Không lấy được AI giải thích/đánh giá");
      } finally {
        setAiLoading(false);
      }
    };

    run();
  }, [attempt, questions, exam, resolvedAttemptId]);

  const explainByNo = useMemo(() => {
    if (!aiExplain || typeof aiExplain !== "object") return new Map();
    const map = new Map();
    for (const q of questions) {
      const k = `q-${resolvedAttemptId}-${q.no || ""}`;
      let found = aiExplain?.[k] || null;

      if (!found) {
        const anyKey = Object.keys(aiExplain).find((x) => String(x).includes(`-${q.no}`));
        if (anyKey) found = aiExplain[anyKey];
      }

      map.set(q.no, found);
    }
    return map;
  }, [aiExplain, questions, resolvedAttemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-10 text-neutral-600">Đang tải chi tiết...</main>
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
            className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold"
          >
            ← Quay lại lịch sử
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Kết quả bài làm</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {attempt.testName} • Ngày làm: {attempt.date || "-"} • attemptId: {resolvedAttemptId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={goFeedbackGeneral}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
            >
              Báo lỗi / Gửi feedback
            </button>
            <button
              onClick={() => navigate("/history")}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold hover:bg-neutral-50"
            >
              ← Quay lại lịch sử
            </button>
          </div>
        </div>

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

        <div className="mt-6 bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Đánh giá năng lực</div>
              <div className="text-xs text-neutral-500 mt-0.5">Nguồn: AI</div>
            </div>
            <div className="text-xs text-neutral-600">
              {aiLoading ? "Đang phân tích..." : aiErr ? "Không có" : "Sẵn sàng"}
            </div>
          </div>

          {aiErr ? (
            <div className="mt-3 text-sm text-red-600">{aiErr}</div>
          ) : aiSummary ? (
            <div className="mt-3">
              <div className="text-sm text-neutral-800 whitespace-pre-wrap">
                {aiSummary.summary || ""}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-neutral-200 rounded-xl p-4">
                  <div className="text-xs text-neutral-500">Level</div>
                  <div className="text-sm font-semibold mt-1">{aiSummary.level || "-"}</div>
                  <div className="mt-3 text-xs text-neutral-500">Strengths</div>
                  <ul className="mt-1 text-sm list-disc pl-5">
                    {(aiSummary.strengths || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="border border-neutral-200 rounded-xl p-4">
                  <div className="text-xs text-neutral-500">Weaknesses</div>
                  <ul className="mt-1 text-sm list-disc pl-5">
                    {(aiSummary.weaknesses || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>

                  <div className="mt-4 text-xs text-neutral-500">Plan</div>
                  <ul className="mt-1 text-sm list-disc pl-5">
                    {(aiSummary.plan || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-neutral-600">
              {aiLoading ? "Đang lấy dữ liệu AI..." : "Chưa có dữ liệu AI."}
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold">Chi tiết câu trả lời</h2>
          </div>

          {!questions.length ? (
            <p className="text-sm text-neutral-600">Chưa có dữ liệu câu hỏi chi tiết cho bài này.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {questions.map((q) => {
                const isCorrect = q.chosenIndex === q.correctIndex;
                const qText = q.question ?? q.content ?? "";
                const ex = explainByNo.get(q.no) || null;

                return (
                  <div
                    key={q.no}
                    className={`border rounded-2xl px-4 py-4 ${
                      isCorrect ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          Câu {q.no}:
                          <div className="mt-1 font-normal">
                            <MathContent content={qText} />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-neutral-600">
                          Topic: {q.topic || "-"} • Difficulty: {q.difficulty || "-"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                          {isCorrect ? "ĐÚNG" : "SAI"}
                        </span>
                        <button
                          onClick={() => goFeedbackQuestion(q.no)}
                          className="px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold"
                        >
                          Báo lỗi câu này
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {(q.options || []).map((opt, idx) => {
                        const isChosen = idx === q.chosenIndex;
                        const isAns = idx === q.correctIndex;
                        return (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-xl border ${
                              isAns
                                ? "border-emerald-300 bg-emerald-50"
                                : isChosen
                                ? "border-red-300 bg-red-50"
                                : "border-neutral-200 bg-white"
                            }`}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                            <MathContent content={String(opt ?? "")} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 bg-white/70 border border-neutral-200 rounded-2xl p-4">
                      <div className="text-xs text-neutral-500">Giải thích (AI)</div>
                      {aiErr ? (
                        <div className="mt-1 text-sm text-red-600">{aiErr}</div>
                      ) : aiLoading ? (
                        <div className="mt-1 text-sm text-neutral-600">Đang tạo lời giải...</div>
                      ) : ex?.explanation ? (
                        <div className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{ex.explanation}</div>
                      ) : (
                        <div className="mt-1 text-sm text-neutral-600">Chưa có lời giải AI cho câu này.</div>
                      )}

                      {!aiLoading && !aiErr && ex ? (
                        <div className="mt-2 text-xs text-neutral-600">
                          Final: {ex.finalAnswer || "-"} • Picked: {ex.picked || "-"} • {ex.isCorrect ? "Đúng" : "Sai"}
                        </div>
                      ) : null}
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
