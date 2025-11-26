import { OpenRouter } from '@openrouter/sdk';
import { env } from '../config/env.js';
import { getSystemPrompt } from '../prompts/systemPrompt.js';

const openRouter = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

export const streamOpenAIResponse = async function* (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  gmailContext?: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = getSystemPrompt();
  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...(gmailContext
      ? [{ role: 'system' as const, content: `Gmail Context: ${gmailContext}` }]
      : []),
    ...messages,
  ];

  const stream = await openRouter.chat.send({
    model: 'openai/gpt-4o',
    messages: conversationMessages,
    stream: true,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content || '';
    if (content) {
      yield content;
    }
  }
};

