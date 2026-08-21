import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { runAgent, resumeAgent, type AgentEvent } from '../agent/runner.js';
import { setupSSE, sendSSE, sendSSEDone, sendSSEError } from '../utils/sse.js';

const streamAgentEvents = async (
  res: Response,
  events: AsyncGenerator<AgentEvent>
) => {
  for await (const event of events) {
    if (event.type === 'token') {
      sendSSE(res, { type: 'token', data: event.data });
    } else if (event.type === 'tool_start') {
      sendSSE(res, {
        type: 'tool_start',
        name: event.name,
        args: event.args,
      });
    } else if (event.type === 'tool_end') {
      sendSSE(res, { type: 'tool_end', name: event.name });
    } else if (event.type === 'needs_approval') {
      sendSSE(res, {
        type: 'needs_approval',
        threadId: event.threadId,
        toolCalls: event.toolCalls,
      });
      res.end();
      return;
    } else if (event.type === 'error') {
      sendSSEError(res, event.error);
      return;
    } else if (event.type === 'done') {
      sendSSEDone(res, event.threadId);
      return;
    }
  }
  sendSSEDone(res);
};

export const streamChat = async (req: Request, res: Response) => {
  const { message, userId } = req.body as {
    message?: string;
    userId?: string;
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!userId?.trim()) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const threadId = randomUUID();
  setupSSE(res);

  try {
    await streamAgentEvents(
      res,
      runAgent({
        userId: userId.trim(),
        message: message.trim(),
        threadId,
      })
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Chat failed';
    if (!res.headersSent) {
      return res.status(500).json({ error: errMessage });
    }
    sendSSEError(res, errMessage);
  }
};

export const resumeChat = async (req: Request, res: Response) => {
  const { userId, threadId, approved } = req.body as {
    userId?: string;
    threadId?: string;
    approved?: boolean;
  };

  if (!userId?.trim() || !threadId?.trim()) {
    return res.status(400).json({ error: 'userId and threadId are required' });
  }

  if (typeof approved !== 'boolean') {
    return res.status(400).json({ error: 'approved must be a boolean' });
  }

  setupSSE(res);

  try {
    await streamAgentEvents(
      res,
      resumeAgent({
        userId: userId.trim(),
        threadId: threadId.trim(),
        approved,
      })
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Resume failed';
    if (!res.headersSent) {
      return res.status(500).json({ error: errMessage });
    }
    sendSSEError(res, errMessage);
  }
};
