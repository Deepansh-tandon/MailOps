"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (!code) {
      setError("No authorization code received");
      setStatus("error");
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/exchange-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange token");
        }

        const data = await response.json();
        
        // Store tokens in localStorage
        localStorage.setItem("gmail_tokens", JSON.stringify(data.tokens));
        
        setStatus("success");
        
        // Redirect to chat page after 1 second
        setTimeout(() => {
          router.push("/chat");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Failed to authenticate");
        setStatus("error");
      }
    };

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <p className="text-white text-xl">Authenticating...</p>
        )}
        {status === "success" && (
          <p className="text-green-400 text-xl">Authentication successful! Redirecting...</p>
        )}
        {status === "error" && (
          <div>
            <p className="text-red-400 text-xl mb-4">Authentication failed</p>
            <p className="text-neutral-400">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-white text-black rounded-lg"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
