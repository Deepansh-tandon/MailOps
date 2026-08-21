"use client";

import { ChatInterface } from "@/components/ui/chat-interface";
import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="h-screen w-full bg-neutral-950 flex flex-col">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 py-6 min-h-0">
        <div className="mb-4 flex-shrink-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Agent chat</h1>
            <p className="text-neutral-400">
              Ask across any connected app — tools chain N-to-N automatically.
            </p>
          </div>
          <Link
            href="/integrations"
            className="text-sm text-neutral-300 underline underline-offset-4 hover:text-white"
          >
            Manage integrations
          </Link>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
