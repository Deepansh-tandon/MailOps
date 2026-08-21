import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/env.js';

export const createChatModel = () => {
  if (!env.OPENROUTER && !env.OPENAI_API_KEY) {
    throw new Error('Set OPENROUTER or OPENAI_API_KEY for the agent LLM');
  }

  if (env.OPENROUTER) {
    return new ChatOpenAI({
      model: env.LLM_MODEL,
      temperature: 0,
      apiKey: env.OPENROUTER,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': env.FRONTEND_URL,
          'X-Title': 'MailOps Agent',
        },
      },
    });
  }

  return new ChatOpenAI({
    model: env.LLM_MODEL,
    temperature: 0,
    apiKey: env.OPENAI_API_KEY,
  });
};
