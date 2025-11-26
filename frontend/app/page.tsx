"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokens = localStorage.getItem("gmail_tokens");
    setIsAuthenticated(!!tokens);
  }, []);

  const handleGetStarted = async () => {
    const tokens = localStorage.getItem("gmail_tokens");
    
    if (tokens) {
      // Already authenticated, go to chat
      router.push("/chat");
    } else {
      // Need to authenticate first
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google`);
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } catch (error) {
        console.error("Failed to get auth URL:", error);
      }
    }
  };

  return (
    <div className="min-h-screen w-full rounded-md bg-neutral-950 relative flex flex-col antialiased">
      <NavbarWrapper />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="max-w-4xl mx-auto p-4 flex flex-col items-center gap-8">
          <h1 className="relative z-10 text-3xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-400 text-center font-sans font-bold">
            AI-Powered Email Assistant
          </h1>
          <div className="relative z-10 text-center space-y-2">
            <p className="text-neutral-300 text-xl md:text-2xl max-w-2xl mx-auto">
              Chat with AI to read, summarize, and send emails seamlessly.
            </p>
            <p className="text-neutral-400 text-xl md:text-2xl max-w-2xl mx-auto">
              Your intelligent Gmail companion powered by advanced AI.
            </p>
          </div>
          <button
            onClick={handleGetStarted}
            className="relative z-10 mt-8 px-6 py-2 bg-white text-black rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            Get Started
          </button>
        </div>
        <BackgroundBeams />
      </div>
    </div>
  );
}
