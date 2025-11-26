import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { getSystemPrompt } from '../prompts/systemPrompt.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.0-flash'; // Use stable model name for free tier

export const streamOpenAIResponse = async function* (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  gmailContext?: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = getSystemPrompt();
  
  // Build system instruction (Gemini uses systemInstruction instead of system messages)
  const systemInstruction = gmailContext
    ? `${systemPrompt}\n\nGmail Context: ${gmailContext}`
    : systemPrompt;

  // Convert messages to Gemini format
  // Gemini doesn't support system role in messages, so we use systemInstruction
  const conversationHistory = messages
    .filter(msg => msg.role !== 'system' && msg.content.trim())
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  if (conversationHistory.length === 0) {
    throw new Error('No messages provided');
  }

  // Reuse model instance for efficiency
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0.7,
    },
  });

  // Separate history from the current message
  const history = conversationHistory.slice(0, -1);
  const currentMessage = conversationHistory[conversationHistory.length - 1];
  
  // Only create chat session if there's history, otherwise use generateContentStream
  if (history.length > 0) {
    const chat = model.startChat({
      history: history,
    });
    
    const result = await chat.sendMessageStream(currentMessage.parts[0].text);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } else {
    // For first message, use generateContentStream directly (more efficient)
    const result = await model.generateContentStream(currentMessage.parts[0].text);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
};

