import { MemorySaver } from '@langchain/langgraph';

/** In-memory checkpointer so interrupt/resume works across HTTP requests (dev). */
export const checkpointer = new MemorySaver();
