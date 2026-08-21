export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type Integration = {
  slug: string;
  label: string;
  description: string;
  connected: boolean;
  connectedAccountId?: string;
};

export type PendingToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export async function fetchIntegrations(userId: string): Promise<Integration[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrations?userId=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load integrations');
  }
  const data = await response.json();
  return data.integrations ?? [];
}

export async function connectIntegration(
  userId: string,
  toolkit: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, toolkit }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to start connection');
  }
  const data = await response.json();
  if (!data.redirectUrl) {
    throw new Error('No redirect URL returned');
  }
  return data.redirectUrl as string;
}
