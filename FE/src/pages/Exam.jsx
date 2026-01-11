import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPost } from "../lib/apiClient.js";
import MathText from "../components/MathText.jsx";

const FILE_BASE =
  import.meta.env.VITE_FILE_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace("/api/v1", "")
    : "http://localhost:8000");

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function pickChoices(q) {
  return (
    q?.questionChoices ||
    q?.questionchoices ||
    q?.QuestionChoices ||
    q?.question_choices ||
    q?.choices ||
    []
  );
}

function normalizeQuestions(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((q) => ({
    ...q,
    content: q?.content ?? q?.question ?? q?.text ?? "",
    questionChoices: pickChoices(q),
  }));
}

export default function Exam() {
  const { id } = useParams();
  const nav = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const durationSec = test?.durationSec ?? 60 * 60;
  const [left, setLeft] = useState(durationSec);

  useEffect(() => {
    let t;
    if (!loading) {
      setLeft(durationSec);
      t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    }
    return () => t && clearInterval(t);
  }, [loading, durationSec]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await apiGet(`/tests/${id}/questions`);

        const root = res?.data ?? res;
        const payload = root?.data ?? root;
        const inner = payload?.data ?? payload;

        const testObj = inner?.test ?? payload?.test ?? root?.test ?? null;

        const qs =
          inner?.questions ??
          payload?.questions ??
          root?.questions ??
          testObj?.questions ??
          [];

        setTest(testObj);
        setQuestions(normalizeQuestions(qs));
      } catch (e) {
        setErr(e?.message || "Không tải được đề thi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const score = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      const picked = answers[q.id];
      if (!picked) continue;
      const choice = (q.questionChoices || []).find((c) => c.id === picked);
      if (choice?.isCorrect) correct += 1;
    }
    return { correct, total: questions.length };
  }, [answers, questions]);

  const submit = async (auto = false) => {
    if (submitting) return;
    setSubmitErr("");
    setSubmitting(true);
    try {
      const usedSec = Math.max(0, (durationSec || 0) - (left || 0));

      const res = await apiPost(`/tests/${id}/attempts`, {
        durationSec: usedSec,
        answers,
      });

      const root = res?.data ?? res;
      const payload = root?.data ?? root;
      const attempt = payload?.data ?? payload;

      alert(
        `Đã nộp bài${auto ? " (tự động hết giờ)" : ""}: ${
          attempt?.correct ?? score.correct
        }/${attempt?.totalQuestions ?? score.total} đúng • Điểm ${
          attempt?.score ?? 0
        }/${attempt?.totalScore ?? 800}`
      );

      const key =
        attempt?.id ||
        (attempt?.attemptId ? `attempt-${attempt.attemptId}` : null);
      if (key) nav(`/history/${key}`);
      else nav("/history");
    } catch (e) {
      setSubmitErr(e?.message || "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!questions.length) return;
    if (left !== 0) return;
    if (submitting) return;
    submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, loading, questions.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardNavbar />
        <div className="max-w-4xl mx-auto p-6 text-neutral-600">
          Đang tải đề...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardNavbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {err}
          </div>
          <button
            onClick={() => nav("/tests")}
            className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardNavbar />
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-semibold">
            {test?.title || `Test #${id}`}
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Mode: {test?.mode} • {questions.length} câu
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-800">
            Đề này hiện chưa load được câu hỏi.
          </div>

          <button
            onClick={() => nav("/tests")}
            className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {test?.title || `Test #${id}`}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Mode: {test?.mode} • {questions.length} câu
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200">
              <div className="text-xs text-neutral-500">Thời gian</div>
              <div className="text-lg font-semibold">{fmt(left)}</div>
            </div>
            <button
              onClick={() => submit(false)}
              disabled={submitting}
              className={
                "px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 " +
                (submitting ? "opacity-60 cursor-not-allowed" : "")
              }
            >
              {submitting ? "Đang nộp..." : "Nộp bài"}
            </button>
            {submitErr ? (
              <div className="mt-2 text-xs text-red-600">{submitErr}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5"
            >
              <div className="font-medium">
                Câu {idx + 1}:
                <div className="mt-1 text-neutral-800">
                  <MathText text={q.content} />
                </div>
              </div>

              {q.imageUrl ? (
                <div className="mt-3">
                  <img
                    src={`${FILE_BASE}${q.imageUrl}`}
                    alt={q.imageAlt || "Hình minh hoạ"}
                    className="max-w-full rounded-xl border border-neutral-200 bg-white"
                    loading="lazy"
                  />
                  {q.imageAlt ? (
                    <div className="mt-1 text-xs text-neutral-500">
                      {q.imageAlt}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 grid gap-2">
                {(q.questionChoices || [])
                  .slice()
                  .sort((a, b) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
                  .map((c, i) => (
                    <label
                      key={c.id}
                      className={
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer " +
                        (answers[q.id] === c.id
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-neutral-200")
                      }
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="mt-1"
                        checked={answers[q.id] === c.id}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: c.id }))
                        }
                      />
                      <div>
                        <div className="text-sm font-semibold">
                          {String.fromCharCode(65 + i)}.
                        </div>
                        <div className="text-sm text-neutral-800">
                          <MathText text={c.choiceText} />
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-neutral-600">
          Đã chọn {Object.keys(answers).length}/{questions.length} câu • Đúng hiện
          tại: {score.correct}
        </div>
      </div>
    </div>
  );
}
