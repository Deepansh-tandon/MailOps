import {
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  StateGraph,
  MessagesAnnotation,
  Command,
  interrupt,
  END,
  START,
} from '@langchain/langgraph';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { checkpointer } from './checkpointer.js';
import { createChatModel } from './llm.js';
import { getAgentSystemPrompt } from './system.js';
import { isWriteTool } from './toolkits.js';

export type PendingToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

const extractToolCalls = (message: AIMessage): PendingToolCall[] => {
  const calls = message.tool_calls ?? [];
  return calls.map((call) => ({
    id: call.id ?? call.name,
    name: call.name,
    args: (call.args ?? {}) as Record<string, unknown>,
  }));
};

const routeAfterAgent = (state: typeof MessagesAnnotation.State) => {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  if (last.tool_calls?.length) {
    return 'tools';
  }
  return END;
};

/**
 * Build a per-user compiled graph with Composio tools bound.
 * Write tools pause via LangGraph interrupt until the client resumes.
 */
export const buildAgentGraph = (tools: StructuredToolInterface[]) => {
  const model = createChatModel().bindTools(tools);
  const toolNode = new ToolNode(tools);

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const hasSystem = state.messages.some((m) => m.getType() === 'system');
    const messages: BaseMessage[] = hasSystem
      ? state.messages
      : [new SystemMessage(getAgentSystemPrompt()), ...state.messages];

    const response = await model.invoke(messages);
    return { messages: [response] };
  };

  const runToolsWithApproval = async (state: typeof MessagesAnnotation.State) => {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    const pending = extractToolCalls(last);
    const writes = pending.filter((call) => isWriteTool(call.name));

    if (writes.length > 0) {
      const decision = interrupt({
        type: 'approval',
        toolCalls: writes,
        allToolCalls: pending,
      }) as { approved?: boolean } | boolean | string;

      const approved =
        decision === true ||
        decision === 'approve' ||
        (typeof decision === 'object' && decision?.approved === true);

      if (!approved) {
        const rejectionMessages = pending.map(
          (call) =>
            new ToolMessage({
              tool_call_id: call.id,
              content: 'User rejected this tool call. Do not retry unless asked.',
            })
        );
        return { messages: rejectionMessages };
      }
    }

    return toolNode.invoke(state);
  };

  return new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', runToolsWithApproval)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', routeAfterAgent, ['tools', END])
    .addEdge('tools', 'agent')
    .compile({ checkpointer });
};

export const resumeCommand = (approved: boolean) =>
  new Command({ resume: approved ? { approved: true } : { approved: false } });
