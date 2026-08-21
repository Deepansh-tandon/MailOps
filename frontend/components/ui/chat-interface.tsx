"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { API_BASE_URL, type PendingToolCall } from "@/lib/api";
import { getOrCreateUserId } from "@/lib/user";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ApprovalState = {
  threadId: string;
  toolCalls: PendingToolCall[];
};

async function consumeAgentStream(
  response: Response,
  onToken: (token: string) => void,
  onApproval: (approval: ApprovalState) => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "token" && parsed.data) {
          onToken(parsed.data);
        } else if (parsed.type === "needs_approval") {
          onApproval({
            threadId: parsed.threadId,
            toolCalls: parsed.toolCalls ?? [],
          });
        } else if (parsed.type === "error") {
          throw new Error(parsed.error || "Agent error");
        }
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
}

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [approval, setApproval] = useState<ApprovalState | null>(null);
  const [userId, setUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistantBuffer = useRef("");

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, approval]);

  const appendAssistantToken = useCallback((token: string) => {
    assistantBuffer.current += token;
    const content = assistantBuffer.current;
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { role: "assistant", content };
        return next;
      }
      return [...next, { role: "assistant", content }];
    });
  }, []);

  const runStream = async (url: string, body: Record<string, unknown>) => {
    setIsStreaming(true);
    setApproval(null);
    assistantBuffer.current = "";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to stream response");
      }

      await consumeAgentStream(response, appendAssistantToken, setApproval);
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : "Request failed";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${text}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming || !userId) return;

    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    await runStream(`${API_BASE_URL}/api/chat/stream`, {
      message: userMessage,
      userId,
    });
  };

  const handleApproval = async (approved: boolean) => {
    if (!approval || !userId) return;
    const threadId = approval.threadId;
    setApproval(null);
    await runStream(`${API_BASE_URL}/api/chat/resume`, {
      userId,
      threadId,
      approved,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar min-h-0">
        {messages.length === 0 && !approval ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-4">
              <p className="text-neutral-300 text-lg mb-2">Multi-app agent</p>
              <p className="text-neutral-500 text-sm mb-4">
                Chain Gmail, Calendar, Slack, Notion, and Drive in any order.
              </p>
              <Link
                href="/integrations"
                className="text-sm text-white underline underline-offset-4 hover:opacity-80"
              >
                Connect integrations
              </Link>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-white border border-neutral-700"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {approval && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-white space-y-3">
            <p className="font-medium">Approval needed for write actions</p>
            <ul className="space-y-2 text-sm text-neutral-200">
              {approval.toolCalls.map((call) => (
                <li
                  key={call.id}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/70 p-3"
                >
                  <p className="font-mono text-amber-200 mb-1">{call.name}</p>
                  <pre className="whitespace-pre-wrap break-words text-neutral-400 text-xs">
                    {JSON.stringify(call.args, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApproval(true)}
                disabled={isStreaming}
                className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleApproval(false)}
                disabled={isStreaming}
                className="rounded-lg border border-neutral-600 px-4 py-2 text-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-white border border-neutral-700 rounded-2xl p-4">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl border p-2 md:rounded-3xl">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <div className="relative z-10 flex h-full items-center gap-4 overflow-hidden rounded-xl border border-gray-600 bg-neutral-950/50 p-3 md:p-5 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask across any connected app..."
              disabled={isStreaming || Boolean(approval)}
              className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none text-base md:text-lg z-10 relative disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || isStreaming || Boolean(approval)}
              className="flex items-center justify-center rounded-lg bg-white text-black p-2 transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
