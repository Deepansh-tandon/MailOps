"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isStreaming) {
      const userMessage = message.trim();
      setMessage("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsStreaming(true);

      // Get tokens from localStorage
      const tokensStr = localStorage.getItem("gmail_tokens");
      const tokens = tokensStr ? JSON.parse(tokensStr) : null;

      try {
        const response = await fetch("http://localhost:8080/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            tokens,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to stream response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "token" && parsed.data) {
                  assistantMessage += parsed.data;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                      newMessages[newMessages.length - 1] = {
                        role: "assistant",
                        content: assistantMessage,
                      };
                    } else {
                      newMessages.push({
                        role: "assistant",
                        content: assistantMessage,
                      });
                    }
                    return newMessages;
                  });
                } else if (parsed.type === "done") {
                  break;
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${error.message}` },
        ]);
      } finally {
        setIsStreaming(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {messages.length > 0 && (
        <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl border p-2 md:rounded-3xl ">
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
              placeholder="Ask me anything ..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none text-base md:text-lg z-10 relative disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || isStreaming}
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

