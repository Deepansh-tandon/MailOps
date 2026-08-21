import { Composio } from '@composio/core';
import { LangchainProvider } from '@composio/langchain';
import { env } from '../config/env.js';
import { PEER_TOOLKITS, TOOLKIT_META, type PeerToolkit } from './toolkits.js';

type ComposioClient = Composio<LangchainProvider>;

let composioClient: ComposioClient | null = null;

export const getComposio = (): ComposioClient => {
  if (!composioClient) {
    if (!env.COMPOSIO_API_KEY) {
      throw new Error('COMPOSIO_API_KEY is not configured');
    }
    composioClient = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
      provider: new LangchainProvider(),
    });
  }
  return composioClient;
};

export const createUserSession = async (userId: string) => {
  const composio = getComposio();
  return composio.create(userId, {
    toolkits: [...PEER_TOOLKITS],
    manageConnections: false,
  });
};

export const getSessionTools = async (userId: string) => {
  const session = await createUserSession(userId);
  const tools = await session.tools();
  return { session, tools };
};

export type IntegrationStatus = {
  slug: PeerToolkit;
  label: string;
  description: string;
  connected: boolean;
  connectedAccountId?: string;
};

export const listIntegrationStatuses = async (
  userId: string
): Promise<IntegrationStatus[]> => {
  const session = await createUserSession(userId);
  const toolkits = await session.toolkits();

  const bySlug = new Map(
    toolkits.items.map((toolkit) => [String(toolkit.slug).toLowerCase(), toolkit])
  );

  return PEER_TOOLKITS.map((slug) => {
    const toolkit = bySlug.get(slug) as
      | {
          connection?: {
            isActive?: boolean;
            connectedAccount?: { id?: string };
            connected_account?: { id?: string };
          };
        }
      | undefined;

    const connection = toolkit?.connection;
    const connectedAccount =
      connection?.connectedAccount ?? connection?.connected_account;
    const connected = Boolean(
      connectedAccount?.id || connection?.isActive === true
    );

    return {
      slug,
      label: TOOLKIT_META[slug].label,
      description: TOOLKIT_META[slug].description,
      connected,
      connectedAccountId: connectedAccount?.id,
    };
  });
};

export const authorizeToolkit = async (
  userId: string,
  toolkit: PeerToolkit,
  callbackUrl: string
) => {
  const session = await createUserSession(userId);
  return session.authorize(toolkit, { callbackUrl });
};
