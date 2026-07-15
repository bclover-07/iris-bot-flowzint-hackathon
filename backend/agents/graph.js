import { StateGraph } from '@langchain/langgraph';
import { AgentState } from './state.js';
import { sentimentNode } from './nodes/sentimentNode.js';
import { securityNode } from './nodes/securityNode.js';
import { ragNode } from './nodes/ragNode.js';
import { toolRouterNode } from './nodes/toolRouterNode.js';
import { llmNode } from './nodes/llmNode.js';
import { responseNode } from './nodes/responseNode.js';

// Initialize the directed graph layout
const workflow = new StateGraph(AgentState)
  .addNode('sentimentNode', sentimentNode)
  .addNode('securityNode', securityNode)
  .addNode('ragNode', ragNode)
  .addNode('toolRouterNode', toolRouterNode)
  .addNode('llmNode', llmNode)
  .addNode('responseNode', responseNode);

// 1. Start by analyzing sentiment and emotion
workflow.addEdge('__start__', 'sentimentNode');

// 2. Go to security firewall node
workflow.addEdge('sentimentNode', 'securityNode');

// 3. Conditional routing from security:
// If injection detected, end immediately. Otherwise check RAG cache.
workflow.addConditionalEdges(
  'securityNode',
  (state) => {
    if (state.injectionStatus === 'blocked') {
      return 'end';
    }
    return 'continue';
  },
  {
    end: '__end__',
    continue: 'ragNode',
  }
);

// 4. Conditional routing from RAG:
// If answered via Local Cache/KB, skip LLM logic and go to final response stage.
// Otherwise evaluate routing and tool actions.
workflow.addConditionalEdges(
  'ragNode',
  (state) => {
    if (state.answer) {
      return 'skip_llm';
    }
    return 'route_llm';
  },
  {
    skip_llm: 'responseNode',
    route_llm: 'toolRouterNode',
  }
);

// 5. Conditional routing from Tool Router:
// If budget exceeded, end. Otherwise run LLM generation.
workflow.addConditionalEdges(
  'toolRouterNode',
  (state) => {
    if (state.budgetMode === 'exceeded') {
      return 'end';
    }
    return 'continue';
  },
  {
    end: '__end__',
    continue: 'llmNode',
  }
);

// 6. Connect LLM Node to response handling
workflow.addEdge('llmNode', 'responseNode');

// 7. Connect response node to End
workflow.addEdge('responseNode', '__end__');

// Compile the executable graph
export const graph = workflow.compile();
