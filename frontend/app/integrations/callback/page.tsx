"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    const toolkit = searchParams.get("toolkit");
    const query = new URLSearchParams();
    if (toolkit) query.set("toolkit", toolkit);
    if (status) query.set("status", status);
    router.replace(`/integrations?${query.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center text-white">
      <p>Finishing connection…</p>
    </div>
  );
}

export default function IntegrationsCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center text-white">
          <p>Loading…</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
