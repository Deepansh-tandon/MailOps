import { Response } from 'express';

export const setupSSE = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  res.flushHeaders();
};

export const sendSSE = (res: Response, payload: Record<string, unknown>) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const sendSSEChunk = (res: Response, chunk: string) => {
  sendSSE(res, { type: 'token', data: chunk });
};

export const sendSSEDone = (res: Response, threadId?: string) => {
  sendSSE(res, { type: 'done', threadId });
  res.end();
};

export const sendSSEError = (res: Response, error: string) => {
  sendSSE(res, { type: 'error', error });
  res.end();
};
