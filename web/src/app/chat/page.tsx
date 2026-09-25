"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Msg = { id: string; role: string; content: string };

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.createConversation().then((c) => setConversationId(c.id)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!conversationId || !input.trim()) return;
    const content = input;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content }]);
    try {
      const reply = await api.sendMessage(conversationId, content);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: "error", role: "assistant", content: "Bir hata oluştu, tekrar dener misin?" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container" style={{ height: "100vh" }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid #efeae1", fontWeight: 700 }}>
        Stech AI
      </div>
      <div style={{ flexGrow: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "78%",
              background: m.role === "user" ? "#e85d3d" : "#f6f3ee",
              color: m.role === "user" ? "#fff" : "#1c1b1a",
              padding: "12px 14px",
              borderRadius: 16,
              fontSize: 14,
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #efeae1" }}>
        <input
          className="input"
          placeholder="Mesaj yaz…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button className="btn-primary" type="submit" disabled={sending || !input.trim()}>
          Gönder
        </button>
      </form>
    </main>
  );
}
