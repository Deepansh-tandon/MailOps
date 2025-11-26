export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GmailIntent {
  type: 'read' | 'summarize' | 'send' | 'none';
  confidence: number;
  details?: {
    query?: string;
    recipient?: string;
    subject?: string;
    body?: string;
  };
}

export interface StreamChunk {
  type: 'token' | 'done' | 'error';
  data?: string;
  error?: string;
}

