"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Conversation is persisted in Supabase (chat_messages table) so it
  // survives a page reload/browser close — load it once on mount.
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "오류가 발생했어요." }]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.changed) router.refresh();
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "네트워크 오류가 발생했어요." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[36rem] w-[28rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
            중계 DB 어시스턴트
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {historyLoaded && messages.length === 0 && (
              <p className="text-neutral-400 dark:text-neutral-500">
                예: &quot;오타니 선수 홈런 44개로 업데이트해줘&quot;, 또는 로스터 표를 그대로 붙여넣어서
                &quot;이 선수들 출신학교·드래프트 정보 채워줘&quot;처럼 여러 줄로 입력해도 돼요. (Shift+Enter로
                줄바꿈, Enter로 전송)
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[90%] rounded-lg bg-neutral-900 px-3 py-2 text-white whitespace-pre-wrap dark:bg-neutral-100 dark:text-neutral-900"
                    : "mr-auto max-w-[90%] rounded-lg bg-neutral-100 px-3 py-2 whitespace-pre-wrap dark:bg-neutral-800 dark:text-neutral-100"
                }
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="mr-auto text-neutral-400 dark:text-neutral-500">생각 중...</div>}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
              rows={1}
              className="max-h-[200px] flex-1 resize-none rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              전송
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        aria-label="챗봇 열기"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
