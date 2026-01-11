import React, { useEffect, useRef, useState } from "react";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiPost } from "../lib/apiClient.js";

export default function StudyAssistant() {
  const AI_CONV_KEY = "study_assistant_ai_conv_id_min";
  const STORAGE_KEY = "study_assistant_chat_min";

  const [conversationId, setConversationId] = useState(() => {
    const raw = localStorage.getItem(AI_CONV_KEY);
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (_) {}
    return [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const callAiChat = async (text) => {
    const payload = {
      message: text,
      conversationId: conversationId || undefined,
    };

    const res = await apiPost("/ai/chat", payload);
    const data = res?.data ?? res ?? {};
    const reply =
      data?.reply ||
      data?.message ||
      (typeof data === "string" ? data : null);

    const cid = data?.conversationId;
    if (cid && Number.isFinite(Number(cid))) {
      try {
        localStorage.setItem(AI_CONV_KEY, String(cid));
      } catch (_) {}
      setConversationId(Number(cid));
    }

    if (!reply) throw new Error("No reply");
    return reply;
  };

  const clearChat = () => {
    setMessages([]);
    setErr("");
    setInput("");
    setConversationId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AI_CONV_KEY);
    } catch (_) {}
  };

  const send = async () => {
    const content = String(input || "").trim();
    if (!content || loading) return;

    setErr("");
    setMessages((prev) => [...prev, { role: "user", content, ts: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callAiChat(content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, ts: Date.now() },
      ]);
    } catch (e) {
      const msg = String(e?.message || "Error");
      if (/401|unauthor/i.test(msg)) {
        setErr("Bạn chưa đăng nhập hoặc token đã hết hạn. Hãy đăng nhập lại.");
      } else {
        setErr("Không gọi được AI. Kiểm tra BE và endpoint /api/v1/ai/chat.");
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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Trợ lý học tập</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Dán đề/câu hỏi/bài làm. Mình sẽ dùng AI để giải thích và hướng dẫn.
            </p>
          </div>

          <button
            onClick={clearChat}
            disabled={loading}
            className="px-3 py-2 text-sm rounded-xl bg-white border border-neutral-200 disabled:opacity-60"
          >
            Cuộc trò chuyện mới
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden flex flex-col h-[72vh]">
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Gợi ý: “Giải câu này và giải thích từng bước…”, hoặc “Mình đang yếu
                phần Đại số, nên luyện gì trước?”
              </div>
            ) : null}

            {messages.map((m, idx) => (
              <MessageBubble key={idx} role={m.role} content={m.content} />
            ))}

            {loading ? (
              <div className="text-sm text-neutral-500">Đang trả lời...</div>
            ) : null}

            {err ? <div className="text-sm text-red-600">{err}</div> : null}
          </div>

          <div className="border-t border-neutral-200 p-3 bg-neutral-50">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Nhập câu hỏi… (Enter để gửi, Shift+Enter để xuống dòng)"
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-black text-white disabled:opacity-60"
              >
                Gửi
              </button>
            </div>
          </div>
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
    ? base + " ml-auto bg-black text-white"
    : base + " bg-neutral-100 text-neutral-900";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={cls}>{content}</div>
    </div>
  );
}
