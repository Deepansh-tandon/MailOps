import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { getSystemPrompt } from '../prompts/systemPrompt.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.0-flash';

export const streamOpenAIResponse = async function* (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  gmailContext?: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = getSystemPrompt();
  
  // Build system instruction (Gemini uses systemInstruction instead of system messages)
  const systemInstruction = gmailContext
    ? `${systemPrompt}\n\nGmail Context: ${gmailContext}\n\nRemember: Always format your response with Heading, Description, and Probable Follow-up Question sections.`
    : systemPrompt;

  // Convert messages to Gemini format
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
    
    const result = await model.generateContentStream(currentMessage.parts[0].text);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
};

export const streamOpenRouterResponse = async function* (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  gmailContext?: string
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = getSystemPrompt();
  
  const systemInstruction = gmailContext
    ? `${systemPrompt}\n\nGmail Context: ${gmailContext}\n\nRemember: Always format your response with Heading, Description, and Probable Follow-up Question sections.`
    : systemPrompt;

  const allMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "qwen/qwen3-coder:free",
      messages: allMessages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body returned from OpenRouter");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // Ignore JSON parse error and continue
        }
      }
    }
  }
};
