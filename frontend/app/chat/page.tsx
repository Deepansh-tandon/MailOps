"use client";

import { ChatInterface } from "@/components/ui/chat-interface";

export default function ChatPage() {
  return (
    <div className="h-screen w-full bg-neutral-950 flex flex-col">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 py-6 min-h-0">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Chat with AI</h1>
          <p className="text-neutral-400">Ask me anything about your emails</p>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

