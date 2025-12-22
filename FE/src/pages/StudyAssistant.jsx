import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiGet, apiPost } from "../lib/apiClient.js";

/**
 * Trợ lý học tập (UI chat) — ưu tiên gọi BE nếu có endpoint,
 * nếu không có thì fallback sang trợ lý offline (hướng dẫn dùng hệ thống + mẹo làm bài).
 */
export default function StudyAssistant() {
  const navigate = useNavigate();
  const STORAGE_KEY = "study_assistant_chat_v1";

  const AI_CONV_KEY = "study_assistant_ai_conv_id";
  const [conversationId, setConversationId] = useState(() => {
    const raw = localStorage.getItem(AI_CONV_KEY);
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [
      {
        role: "assistant",
        content:
          "Chào bạn! Mình là Trợ lý học tập. Có thể hỏi về cách dùng hệ thống (Bài thi/Exam/Lịch sử/Thống kê) hoặc nhờ gợi ý cách làm bài.",
        ts: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const quickPrompts = useMemo(
    () => [
      "Hướng dẫn tạo bài thi (Tests) như thế nào?",
      "Khi vào Exam thì làm bài và nộp bài ra sao?",
      "Giải thích giúp mình cách xem Lịch sử làm bài.",
      "Gợi ý chiến lược làm SAT/HSA để tối ưu điểm.",
      "Mình bị lỗi đăng nhập/đăng ký thì cần kiểm tra gì?",
    ],
    []
  );

  const clearChat = () => {
    const init = [
      {
        role: "assistant",
        content:
          "Đã xóa cuộc trò chuyện. Bạn muốn hỏi gì tiếp theo? (ví dụ: cách vào Bài thi, cách làm Exam, hoặc mẹo làm bài)",
        ts: Date.now(),
      },
    ];
    setMessages(init);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    } catch (_) {}
  };

  const buildOfflineReply = (text) => {
    const t = (text || "").toLowerCase();

    // hướng dẫn theo module
    if (t.includes("tests") || t.includes("bài thi") || t.includes("tạo bài")) {
      return (
        "Về module **Bài thi (Tests)**:\n" +
        "1) Vào **Bài thi** trên thanh bar.\n" +
        "2) Chọn một bài thi trong danh sách để xem chi tiết.\n" +
        "3) Nhấn **Bắt đầu** để chuyển sang màn hình **Exam** và làm bài.\n\n" +
        "Nếu danh sách trống: kiểm tra backend đã chạy + cấu hình API base (VITE_API_BASE_URL hoặc VITE_API_BASE) hoặc dữ liệu bài thi trong DB."
      );
    }
    if (t.includes("exam") || t.includes("làm bài") || t.includes("nộp")) {
      return (
        "Về module **Exam (Làm bài)**:\n" +
        "• Đọc kỹ yêu cầu câu hỏi, làm từ dễ → khó để giữ nhịp.\n" +
        "• Với câu khó: đánh dấu (nếu UI có) và quay lại sau.\n" +
        "• Trước khi **Nộp bài**: rà lại câu chưa chọn/điền.\n\n" +
        "Nếu bạn gửi ảnh lỗi/đoạn code liên quan Exam, mình có thể chỉ ra file cần sửa."
      );
    }
    if (t.includes("lịch sử") || t.includes("history")) {
      return (
        "Về **Lịch sử làm bài**:\n" +
        "• Vào **Lịch sử làm bài** để xem các lần làm gần đây.\n" +
        "• Bấm vào một lần làm để xem chi tiết (điểm, thời gian, đúng/sai...).\n" +
        "Nếu không thấy dữ liệu: kiểm tra API attempt/history ở backend hoặc userId đang đăng nhập."
      );
    }
    if (t.includes("thống kê") || t.includes("stats")) {
      return (
        "Về **Thống kê (Stats)**:\n" +
        "• Theo dõi xu hướng điểm số, độ chính xác, thời gian trung bình/câu.\n" +
        "• Dựa vào đó chọn lại chiến lược: tăng tốc ở dạng câu mạnh, luyện thêm dạng câu yếu.\n\n" +
        "Muốn mình gợi ý kế hoạch luyện 7 ngày/14 ngày thì nói rõ mục tiêu điểm và thời gian bạn có mỗi ngày."
      );
    }
    if (t.includes("đăng nhập") || t.includes("login") || t.includes("token") || t.includes("jwt")) {
      return (
        "Về **Đăng nhập/Token**:\n" +
        "• Nếu bị 401/403: kiểm tra token có được lưu (localStorage) và có gắn vào header Authorization.\n" +
        "• Nếu BE dùng prefix **/api/v1**: đảm bảo FE gọi đúng URL.\n" +
        "• Nếu CORS lỗi: cần bật CORS ở NestJS.\n\n" +
        "Bạn có thể gửi log lỗi (Console/Network) để mình chỉ đúng chỗ cần sửa."
      );
    }

    // chiến lược làm bài
    if (t.includes("chiến lược") || t.includes("sat") || t.includes("hsa") || t.includes("mẹo")) {
      return (
        "Một vài chiến lược nhanh để tối ưu điểm:\n" +
        "1) **Quản lý thời gian**: giới hạn mỗi câu, câu quá khó thì tạm bỏ.\n" +
        "2) **Loại trừ đáp án**: đặc biệt với trắc nghiệm, loại 1–2 phương án sai rõ ràng trước.\n" +
        "3) **Sai vì ẩu**: luôn check lại đơn vị, dấu âm/dương, điều kiện biên.\n" +
        "4) **Ôn theo lỗi**: sau mỗi bài, nhìn lại nhóm câu sai nhiều nhất để luyện tập trung.\n\n" +
        "Bạn nói rõ bạn đang yếu phần nào (Toán/Đọc/Logic...), mình sẽ gợi ý bài tập/chiến lược chi tiết hơn."
      );
    }

    return (
      "Mình hiểu rồi. Bạn có thể nói rõ hơn bạn đang cần hỗ trợ phần nào?\n" +
      "• Dùng hệ thống (Bài thi/Exam/Lịch sử/Thống kê)\n" +
      "• Hoặc cần giải thích 1 câu hỏi cụ thể (bạn dán đề/ảnh)\n" +
      "• Hoặc muốn lập kế hoạch luyện tập theo mục tiêu điểm"
    );
  };

  const callBackendAssistant = async (text) => {
    // Endpoint: POST /api/v1/ai/chat
    const payload = {
      message: text,
      conversationId: conversationId || undefined,
    };
    const res = await apiPost("/ai/chat", payload);
    const reply = res?.data?.reply || res?.message || (typeof res === "string" ? res : null);
    const cid = res?.data?.conversationId;
    if (cid && Number.isFinite(Number(cid))) {
      try {
        localStorage.setItem(AI_CONV_KEY, String(cid));
      } catch (_) {}
      setConversationId(Number(cid));
    }
    if (!reply) throw new Error("No reply");
    return reply;
  };

  const askInsights = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiGet("/ai/insights");
      const d = res?.data || {};
      const ov = d?.overview || {};
      const sp = d?.speed || {};

      const lines = [
        `Tổng quan luyện tập:`,
        `- Đã làm: ${ov?.totalTests ?? 0} đề`,
        `- Điểm trung bình: ${ov?.avgScore ?? 0}`,
        `- Điểm cao nhất: ${ov?.bestScore ?? 0}`,
        `- Tổng số câu: ${ov?.totalQuestions ?? 0}`,
        `- Tổng thời gian: ${Math.round((ov?.totalDurationSec ?? 0) / 60)} phút`,
        `- TB 1 câu: ${sp?.avgTimePerQuestionSec ?? 0}s`,
        `- TB 1 đề: ${Math.round((sp?.avgTimePerTestSec ?? 0) / 60)} phút`,
      ];

      const weak = d?.weakSkills || [];
      if (weak.length) {
        lines.push("\nĐiểm yếu gợi ý (theo độ chính xác):");
        weak.slice(0, 5).forEach((w) => {
          const pct = Math.round((Number(w?.accuracy || 0)) * 100);
          const total = Number(w?.total || 0);
          const correct = Math.round(total * (Number(w?.accuracy || 0)));
          lines.push(`- ${w?.skill || "(không rõ)"}: ${pct}% (${correct}/${total})`);
        });
      }

      const recent = d?.recent3 || [];
      if (recent.length) {
        lines.push("\n3 đề gần nhất:");
        recent.forEach((r) => {
          const pct = Math.round((Number(r?.accuracy || 0)) * 100);
          const mins = Math.round((Number(r?.durationSec || 0)) / 60);
          lines.push(`- ${r?.testTitle || "(không rõ)"}: ${r?.score ?? 0} điểm, ${pct}%, ${mins} phút`);
        });
      }
      setMessages((prev) => [...prev, { role: "assistant", content: lines.join("\n"), ts: Date.now() }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: e?.message || "Không lấy được thống kê.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeTest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiPost("/ai/generate-test", { exam: "auto", numQuestions: 10 });
      const testId = res?.data?.testId;
      const title = res?.data?.title;
      if (testId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Mình đã tạo 1 đề luyện tập mới: ${title || ""}\nBạn có thể làm ngay: /exam/${testId}`,
            ts: Date.now(),
          },
        ]);
        navigate(`/exam/${testId}`);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Tạo đề thất bại.", ts: Date.now() }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: e?.message || "Tạo đề thất bại.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg = { role: "user", content, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // ưu tiên backend
      const reply = await callBackendAssistant(content);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (e) {
      const msg = String(e?.message || "");
      if (/401|unauthor/i.test(msg)) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Bạn chưa đăng nhập hoặc token đã hết hạn (401). Hãy đăng nhập lại rồi thử chat AI nhé.",
            ts: Date.now(),
          },
        ]);
      } else {
        // fallback offline
        const reply = buildOfflineReply(content);
        setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Trợ lý học tập
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Chat để hỏi nhanh cách dùng hệ thống hoặc nhờ gợi ý làm bài.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={askInsights}
              className="px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-neutral-200 hover:ring-neutral-300 shadow-sm"
            >
              Xem gợi ý học
            </button>
            <button
              onClick={generatePracticeTest}
              className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm rounded-lg"
            >
              Sinh đề theo điểm yếu
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-neutral-200 hover:ring-neutral-300 shadow-sm"
            >
              Xóa chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: quick prompts */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-sm p-4">
              <div className="font-semibold mb-2">Gợi ý nhanh</div>
              <div className="flex flex-col gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-left text-sm px-3 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 ring-1 ring-neutral-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-sm p-4">
              <div className="font-semibold mb-2">Mẹo dùng nhanh</div>
              <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
                <li>Enter để gửi, Shift+Enter để xuống dòng.</li>
                <li>Dán đề/câu hỏi vào chat để được gợi ý.</li>
                <li>Nếu AI BE chưa có endpoint, hệ thống sẽ dùng trợ lý offline.</li>
              </ul>
              <div className="mt-3 text-xs text-neutral-500">
                Gợi ý cấu hình API: tạo <span className="font-mono">VITE_API_BASE_URL</span> (hoặc <span className="font-mono">VITE_API_BASE</span>) trong file <span className="font-mono">.env</span>
                (vd: <span className="font-mono">VITE_API_BASE_URL=http://localhost:8000/api/v1</span>)
              </div>
            </div>
          </aside>

          {/* Right: chat */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-sm overflow-hidden flex flex-col h-[72vh]">
              {/* Messages */}
              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, idx) => (
                  <MessageBubble key={idx} role={m.role} content={m.content} />
                ))}
                {loading && (
                  <div className="text-sm text-neutral-500">
                    Trợ lý đang trả lời...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-neutral-200 p-3 bg-neutral-50">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder="Nhập câu hỏi… (Enter để gửi)"
                    className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gửi
                  </button>
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  Bạn có thể hỏi: “Giải thích câu 12 trong đề…” hoặc “Tạo kế hoạch luyện 7 ngày để đạt 700+”.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  const base =
    "max-w-[90%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed";

  const cls = isUser
    ? base + " ml-auto bg-green-700 text-white"
    : base + " bg-neutral-100 text-neutral-900";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={cls}>
        {!isUser && (
          <div className="text-[11px] font-semibold text-neutral-600 mb-1">
            Trợ lý
          </div>
        )}
        <div>{content}</div>
      </div>
    </div>
  );
}
