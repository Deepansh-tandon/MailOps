import { Response } from 'express';

export const setupSSE = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  res.flushHeaders();
};

export const sendSSEChunk = (res: Response, chunk: string) => {
  res.write(`data: ${JSON.stringify({ type: 'token', data: chunk })}\n\n`);
};

export const sendSSEDone = (res: Response) => {
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
};

export const sendSSEError = (res: Response, error: string) => {
  res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
  res.end();
};

