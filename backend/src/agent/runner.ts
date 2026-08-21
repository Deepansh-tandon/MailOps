import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { isGraphInterrupt } from '@langchain/langgraph';
import { getSessionTools } from './composio.js';
import { buildAgentGraph, resumeCommand, type PendingToolCall } from './graph.js';

export type AgentEvent =
  | { type: 'token'; data: string }
  | { type: 'tool_start'; name: string; args: Record<string, unknown> }
  | { type: 'tool_end'; name: string }
  | {
      type: 'needs_approval';
      threadId: string;
      toolCalls: PendingToolCall[];
    }
  | { type: 'done'; threadId: string }
  | { type: 'error'; error: string };

const getInterruptPayload = (error: unknown): PendingToolCall[] | null => {
  if (!isGraphInterrupt(error)) return null;
  const interrupts = error.interrupts ?? [];
  for (const item of interrupts) {
    const value = item.value as {
      type?: string;
      toolCalls?: PendingToolCall[];
    };
    if (value?.toolCalls?.length) {
      return value.toolCalls;
    }
  }
  return null;
};

async function* streamGraph(
  graph: ReturnType<typeof buildAgentGraph>,
  input: unknown,
  threadId: string
): AsyncGenerator<AgentEvent> {
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: 40,
  };

  try {
    const stream = await graph.stream(input as never, {
      ...config,
      streamMode: 'messages',
    });

    for await (const chunk of stream) {
      const [message, metadata] = chunk as [
        { content?: unknown; tool_calls?: AIMessage['tool_calls'] },
        { langgraph_node?: string }
      ];
      if (metadata?.langgraph_node !== 'agent') continue;

      const content = message.content;
      if (typeof content === 'string' && content) {
        yield { type: 'token', data: content };
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part === 'string' && part) {
            yield { type: 'token', data: part };
          } else if (
            part &&
            typeof part === 'object' &&
            'type' in part &&
            part.type === 'text' &&
            'text' in part &&
            typeof part.text === 'string'
          ) {
            yield { type: 'token', data: part.text };
          }
        }
      }

      const toolCalls = message.tool_calls;
      if (toolCalls?.length) {
        for (const call of toolCalls) {
          yield {
            type: 'tool_start',
            name: call.name,
            args: (call.args ?? {}) as Record<string, unknown>,
          };
        }
      }
    }

    const state = await graph.getState(config);
    const pendingInterrupt = state.tasks
      ?.flatMap((task) => task.interrupts ?? [])
      .map((item) => item.value as { toolCalls?: PendingToolCall[] })
      .find((value) => value?.toolCalls?.length);

    if (pendingInterrupt?.toolCalls?.length) {
      yield {
        type: 'needs_approval',
        threadId,
        toolCalls: pendingInterrupt.toolCalls,
      };
      return;
    }

    yield { type: 'done', threadId };
  } catch (error: unknown) {
    const toolCalls = getInterruptPayload(error);
    if (toolCalls) {
      yield { type: 'needs_approval', threadId, toolCalls };
      return;
    }
    const message = error instanceof Error ? error.message : 'Agent failed';
    yield { type: 'error', error: message };
  }
}

export async function* runAgent(params: {
  userId: string;
  message: string;
  threadId: string;
}): AsyncGenerator<AgentEvent> {
  const { tools } = await getSessionTools(params.userId);
  if (!tools.length) {
    yield {
      type: 'error',
      error:
        'No tools available. Connect integrations and ensure COMPOSIO_API_KEY is set.',
    };
    return;
  }

  const graph = buildAgentGraph(tools as never);
  yield* streamGraph(
    graph,
    { messages: [new HumanMessage(params.message)] },
    params.threadId
  );
}

export async function* resumeAgent(params: {
  userId: string;
  threadId: string;
  approved: boolean;
}): AsyncGenerator<AgentEvent> {
  const { tools } = await getSessionTools(params.userId);
  const graph = buildAgentGraph(tools as never);
  yield* streamGraph(graph, resumeCommand(params.approved), params.threadId);
}
