import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPENROUTER: process.env.OPENROUTER || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY || '',
  LLM_MODEL: process.env.LLM_MODEL || 'openai/gpt-4o-mini',
};

