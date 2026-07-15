import { Annotation } from '@langchain/langgraph';

/**
 * Defines the state schema for our LangGraph.js cognitive routing agent.
 * This represents the conversational and execution context passed between nodes.
 */
export const AgentState = Annotation.Root({
  // Unique session tracking
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  userId: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  
  // User input message
  message: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  
  // Recent chat context
  chatHistory: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  // Sentiment analysis results
  sentiment: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Injection detection status ('clean', 'suspicious', 'blocked')
  injectionStatus: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'clean',
  }),
  
  // Classification info (tier, score, reasons, signals)
  classification: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Found RAG content or cached content
  retrievedContext: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Model selection decisions
  selectedModel: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  routingReason: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  degraded: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  budgetMode: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'normal',
  }),

  // Web search results (if triggered)
  webSearchResults: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Flag indicating if the user has requested a specialized tool (e.g. Socratic mode, Quiz, Career)
  socraticMode: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  webSearchMode: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),

  // Main final response container
  answer: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Cost and token tracking details
  cost: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  costSavings: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  tokens: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  latencyMs: Annotation({
    reducer: (x, y) => y ?? x,
  }),

  // Metadata/Trace of nodes visited
  trace: Annotation({
    reducer: (x, y) => [...(x ?? []), ...(y ?? [])],
    default: () => [],
  }),
});
