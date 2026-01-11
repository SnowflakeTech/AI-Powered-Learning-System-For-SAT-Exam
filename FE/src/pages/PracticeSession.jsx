import React, { useEffect, useMemo, useState } from "react";
import DashboardNavBar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPost } from "../lib/apiClient.js";
import { useLocation, useNavigate } from "react-router-dom";
import MathContent from "../components/MathContent.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getApiHost() {
  const base =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:8000/api/v1";
  return String(base).replace(/\/api\/v1\/?$/, "");
}

export default function PracticeSession() {
  const q = useQuery();
  const navigate = useNavigate();

  const exam = q.get("exam") || "SAT";
  const section = q.get("section") || "";
  const skill = q.get("skill") || "";
  const difficulty = q.get("difficulty") || "";
  const limit = q.get("limit") || "10";
  const ids = q.get("ids") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [explanations, setExplanations] = useState({});
  const [aiSummary, setAiSummary] = useState(null);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      setAiErr("");
      setExplanations({});
      setAiSummary(null);
      setSubmitted(false);
      setAnswers({});

      const sp = new URLSearchParams();
      if (ids) {
        sp.set("ids", ids);
        const res = await apiGet(`/question/by-ids?${sp.toString()}`);
        const rows = res?.data || res;
        setQuestions(Array.isArray(rows) ? rows : []);
        return;
      }

      if (exam) sp.set("exam", exam);
      if (section) sp.set("section", section);
      if (skill) sp.set("skill", skill);
      if (difficulty) sp.set("difficulty", difficulty);
      if (limit) sp.set("limit", limit);

      const res = await apiGet(`/question/practice?${sp.toString()}`);
      const rows = res?.data || res;
      setQuestions(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setQuestions([]);
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [exam, section, skill, difficulty, limit, ids]);

  function choose(questionId, choiceId) {
    if (submitted) return;
    setAnswers((p) => ({ ...p, [questionId]: choiceId }));
  }

  const score = useMemo(() => {
    if (!submitted) return null;
    let s = 0;
    for (const qq of questions) {
      const picked = answers[qq.id];
      const correct = (qq.choices || []).find((c) => c.isCorrect);
      if (correct && picked === correct.id) s++;
    }
    return { correct: s, total: questions.length };
  }, [submitted, questions, answers]);

  async function submit() {
    if (submitted) return;
    setSubmitted(true);
    setAiErr("");
    setAiLoading(true);

    try {
      const payload = questions.map((qq) => {
        const correctIdx = (qq.choices || []).findIndex((c) => c.isCorrect);
        const correctLabel =
          correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : "A";

        const pickedId = answers[qq.id];
        const pickedIdx = (qq.choices || []).findIndex((c) => c.id === pickedId);
        const pickedLabel =
          pickedIdx >= 0 ? String.fromCharCode(65 + pickedIdx) : null;

        return {
          questionId: qq.id,
          content: qq.content,
          choices: (qq.choices || []).map((c, i) => ({
            label: String.fromCharCode(65 + i),
            text: c.text,
          })),
          correct: correctLabel,
          picked: pickedLabel,
          section: qq.section || null,
          skill: qq.skill || null,
          difficulty: qq.difficulty || null,
        };
      });

      const explainRes = await apiPost("/ai/explain-questions", {
        exam,
        questions: payload,
      });

      const explainData = explainRes?.data || explainRes;
      const exp = explainData?.explanations || {};
      setExplanations(exp);

      const summaryRes = await apiPost("/ai/practice-summary", {
        exam,
        section: section || null,
        skill: skill || null,
        difficulty: difficulty || null,
        results: payload.map((x) => ({
          questionId: x.questionId,
          section: x.section,
          skill: x.skill,
          difficulty: x.difficulty,
          correct: x.picked
            ? String(x.picked).toUpperCase() === String(x.correct).toUpperCase()
            : false,
          picked: x.picked,
          correctLabel: x.correct,
        })),
      });

      const summaryData = summaryRes?.data || summaryRes;
      setAiSummary(summaryData || null);
    } catch (e) {
      setAiErr(e?.message || "AI error");
    } finally {
      setAiLoading(false);
    }
  }

  function getExplainKey(qq) {
    return String(qq.id);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavBar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Luyện theo kỹ năng</h1>
            <div className="mt-1 text-sm text-neutral-600">
              {exam} • {questions.length} câu
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/practice")}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 font-medium"
            >
              Quay lại
            </button>
            <button
              onClick={load}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 font-medium"
            >
              Lấy bộ mới
            </button>
            <button
              onClick={submit}
              disabled={submitted || loading || questions.length === 0}
              className="rounded-xl bg-black text-white px-4 py-2 font-medium disabled:opacity-60"
            >
              Nộp
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {err}
          </div>
        ) : null}

        {aiErr ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {aiErr}
          </div>
        ) : null}

        {score ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <div className="font-semibold">
              Kết quả: {score.correct}/{score.total}
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              Đang tải...
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              Không có câu hỏi phù hợp.
            </div>
          ) : (
            questions.map((qq, idx) => {
              const picked = answers[qq.id];
              const correct = (qq.choices || []).find((c) => c.isCorrect);

              const key = getExplainKey(qq);
              const exp = explanations?.[key];

              return (
                <div
                  key={qq.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-6"
                >
                  <div className="text-sm text-neutral-600">
                    Câu {idx + 1} • {qq.section} • {qq.skill} • {qq.difficulty}
                  </div>

                  {qq.imageUrl ? (
                    <img
                      src={`${getApiHost()}${qq.imageUrl}`}
                      alt={qq.imageAlt || ""}
                      className="mt-3 max-h-72 rounded-xl border border-neutral-200 bg-white"
                      loading="lazy"
                    />
                  ) : null}

                  <div className="mt-3">
                    <div className="font-medium mb-1">Đề bài</div>
                    <div className="text-neutral-900">
                      <MathContent content={qq.content} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(qq.choices || []).map((c, i) => {
                      const isPicked = picked === c.id;
                      const isCorrect = submitted && correct && c.id === correct.id;
                      const isWrongPicked =
                        submitted && isPicked && correct && c.id !== correct.id;

                      return (
                        <button
                          key={c.id}
                          onClick={() => choose(qq.id, c.id)}
                          className={[
                            "w-full text-left rounded-xl border px-4 py-3 text-sm",
                            isPicked ? "border-black" : "border-neutral-200",
                            isCorrect ? "bg-green-50 border-green-200" : "",
                            isWrongPicked ? "bg-red-50 border-red-200" : "",
                          ].join(" ")}
                        >
                          <div className="font-semibold">
                            {String.fromCharCode(65 + i)}.
                          </div>
                          <div className="mt-1 text-neutral-900">
                            <MathContent content={c.text} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {submitted ? (
                    <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                      <div className="font-semibold">Giải đáp</div>
                      <div className="mt-1">
                        {aiLoading && !exp
                          ? "Đang tạo giải đáp..."
                          : exp?.explanation || "Chưa có giải đáp."}
                      </div>
                      {exp?.note ? (
                        <div className="mt-2 text-neutral-600">{exp.note}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {submitted ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="text-lg font-semibold">Đánh giá năng lực</div>
            {aiLoading && !aiSummary ? (
              <div className="mt-2 text-sm text-neutral-600">
                Đang tạo đánh giá...
              </div>
            ) : aiSummary ? (
              <div className="mt-3 space-y-3">
                <div>{aiSummary.summary}</div>
                <div className="text-sm">
                  <span className="font-semibold">Mức:</span> {aiSummary.level}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Điểm mạnh:</span>{" "}
                  {(aiSummary.strengths || []).join(", ") || "Chưa rõ"}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Điểm yếu:</span>{" "}
                  {(aiSummary.weaknesses || []).join(", ") || "Chưa rõ"}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">Kế hoạch gợi ý</div>
                  <div className="mt-2 space-y-1">
                    {(aiSummary.plan || []).map((x, i) => (
                      <div key={i}>{x}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-neutral-600">Chưa có đánh giá.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
