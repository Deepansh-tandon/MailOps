"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full rounded-md bg-neutral-950 relative flex flex-col antialiased">
      <NavbarWrapper />
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto p-4 flex flex-col items-center gap-8">
          <h1 className="relative z-10 text-3xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-400 text-center font-sans font-bold">
            Multi-app AI agent
          </h1>
          <div className="relative z-10 text-center space-y-2">
            <p className="text-neutral-300 text-xl md:text-2xl max-w-2xl mx-auto">
              Connect Gmail, Calendar, Slack, Notion, and Drive — then chain them in any order.
            </p>
            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
              Powered by Composio tools and LangGraph orchestration.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => router.push("/integrations")}
              className="px-6 py-2 bg-white text-black rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Connect apps
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="px-6 py-2 border border-neutral-600 text-white rounded-lg font-semibold text-lg hover:bg-neutral-900 transition-colors"
            >
              Open chat
            </button>
          </div>
        </div>
        <BackgroundBeams />
      </div>
    </div>
  );
}
