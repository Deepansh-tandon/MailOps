import { Request, Response } from 'express';
import {
  authorizeToolkit,
  listIntegrationStatuses,
} from '../agent/composio.js';
import { PEER_TOOLKITS, type PeerToolkit } from '../agent/toolkits.js';
import { env } from '../config/env.js';

export const getIntegrations = async (req: Request, res: Response) => {
  const userId = String(req.query.userId || '');
  if (!userId.trim()) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const integrations = await listIntegrationStatuses(userId.trim());
    res.json({ integrations });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to list integrations';
    res.status(500).json({ error: message });
  }
};

export const connectIntegration = async (req: Request, res: Response) => {
  const { userId, toolkit } = req.body as {
    userId?: string;
    toolkit?: string;
  };

  if (!userId?.trim() || !toolkit?.trim()) {
    return res.status(400).json({ error: 'userId and toolkit are required' });
  }

  if (!PEER_TOOLKITS.includes(toolkit as PeerToolkit)) {
    return res.status(400).json({
      error: `Unsupported toolkit. Use one of: ${PEER_TOOLKITS.join(', ')}`,
    });
  }

  try {
    const callbackUrl = `${env.FRONTEND_URL}/integrations/callback?toolkit=${encodeURIComponent(toolkit)}`;
    const connectionRequest = await authorizeToolkit(
      userId.trim(),
      toolkit as PeerToolkit,
      callbackUrl
    );

    const redirectUrl =
      connectionRequest.redirectUrl ||
      (connectionRequest as { redirect_url?: string }).redirect_url;

    if (!redirectUrl) {
      return res.status(500).json({ error: 'Composio did not return a redirect URL' });
    }

    res.json({
      redirectUrl,
      connectionId: connectionRequest.id,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to start connection';
    res.status(500).json({ error: message });
  }
};
