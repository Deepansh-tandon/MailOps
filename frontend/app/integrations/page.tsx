"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  connectIntegration,
  fetchIntegrations,
  type Integration,
} from "@/lib/api";
import { getOrCreateUserId } from "@/lib/user";

export default function IntegrationsPage() {
  const [userId, setUserId] = useState("");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const items = await fetchIntegrations(id);
      setIntegrations(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    load(id);
  }, []);

  const handleConnect = async (slug: string) => {
    if (!userId) return;
    setConnecting(slug);
    setError("");
    try {
      const redirectUrl = await connectIntegration(userId, slug);
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connect failed");
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-neutral-500 text-sm mb-2">MailOps</p>
            <h1 className="text-3xl md:text-4xl font-bold">Integrations</h1>
            <p className="text-neutral-400 mt-2 max-w-xl">
              Connect peer apps. The agent can move between any of them — Slack to
              Calendar, Notion to Gmail, and so on.
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium self-start"
          >
            Open chat
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-neutral-400">Loading connections…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {integrations.map((item) => (
              <div
                key={item.slug}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{item.label}</h2>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.connected
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {item.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-2">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleConnect(item.slug)}
                  disabled={connecting === item.slug}
                  className="mt-auto rounded-lg border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                >
                  {connecting === item.slug
                    ? "Redirecting…"
                    : item.connected
                      ? "Reconnect"
                      : "Connect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
