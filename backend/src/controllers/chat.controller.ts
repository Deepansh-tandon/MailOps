import { Request, Response } from 'express';
import { detectGmailIntent } from '../services/intent.service.js';
import { handleGmailAction } from './gmail.controller.js';
import { streamOpenAIResponse } from '../services/openai.service.js';
import { setupSSE, sendSSEChunk, sendSSEDone, sendSSEError } from '../utils/sse.js';

export const streamChat = async (req: Request, res: Response) => {
  const { message, tokens } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  setupSSE(res);

  try {
    const intent = detectGmailIntent(message);
    let gmailContext = '';

    if (intent.type !== 'none' && tokens) {
      try {
        gmailContext = await handleGmailAction(intent, tokens);
      } catch (error: any) {
        sendSSEError(res, error.message);
        return;
      }
    }

    const messages = [{ role: 'user' as const, content: message }];
    
    for await (const chunk of streamOpenAIResponse(messages, gmailContext)) {
      sendSSEChunk(res, chunk);
    }
    
    sendSSEDone(res);
  } catch (error: any) {
    sendSSEError(res, error.message);
  }
};

