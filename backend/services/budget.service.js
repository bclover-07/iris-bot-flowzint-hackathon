import dotenv from 'dotenv';
import { BudgetTracker } from '../models/BudgetTracker.model.js';

dotenv.config();

const SESSION_BUDGET = parseFloat(process.env.SESSION_BUDGET || '2.00');

// In-memory cache for ultra-fast reads, synced with MongoDB
const budgetCache = new Map();

export async function getBudgetState(sessionId) {
  if (!sessionId) return { spent: 0, calls: 0, blockedCalls: 0, history: [] };

  if (budgetCache.has(sessionId)) {
    return budgetCache.get(sessionId);
  }

  // Load from MongoDB
  let tracker = await BudgetTracker.findOne({ sessionId });
  if (!tracker) {
    tracker = await BudgetTracker.create({
      sessionId,
      spent: 0,
      calls: 0,
      blockedCalls: 0,
      history: [],
    });
  }

  const state = {
    spent: tracker.spent,
    calls: tracker.calls,
    blockedCalls: tracker.blockedCalls,
    history: tracker.history || [],
  };

  budgetCache.set(sessionId, state);
  return state;
}

export async function getDegradedModel(sessionId, classifiedModel) {
  const state = await getBudgetState(sessionId);
  const remaining = SESSION_BUDGET - state.spent;

  if (remaining <= 0) return null;
  
  // Percentage-based degradation logic:
  // If less than 10% of budget remains, force Kimi (Tier 1)
  if (remaining < (SESSION_BUDGET * 0.10)) {
    return 'mzai:moonshotai/Kimi-K2.6';
  }
  
  // If less than 30% of budget remains, downgrade Medium (Haiku) to Kimi (Tier 1)
  if (remaining < (SESSION_BUDGET * 0.30)) {
    if (classifiedModel === 'anthropic:claude-haiku-4-5' || classifiedModel === 'anthropic:claude-sonnet-4-6') {
      return 'mzai:moonshotai/Kimi-K2.6';
    }
  }
  
  return classifiedModel;
}

export async function getBudgetMode(sessionId) {
  const state = await getBudgetState(sessionId);
  const spent = state.spent;
  
  if (spent >= SESSION_BUDGET) return 'exceeded';
  if (spent >= (SESSION_BUDGET * 0.95)) return 'critical';
  if (spent >= (SESSION_BUDGET * 0.80)) return 'caution';
  return 'normal';
}

export async function recordSpend(sessionId, model, cost, routingData) {
  const state = await getBudgetState(sessionId);
  
  state.spent = Math.min(parseFloat((state.spent + cost).toFixed(8)), SESSION_BUDGET);
  state.calls += 1;
  state.history.push({
    timestamp: new Date(),
    model,
    cost,
    tier: routingData.tier,
    score: routingData.score,
    reason: routingData.reason,
  });

  budgetCache.set(sessionId, state);

  // Async update MongoDB in background (don't block the request)
  BudgetTracker.findOneAndUpdate(
    { sessionId },
    { 
      $set: { spent: state.spent, calls: state.calls },
      $push: { history: state.history[state.history.length - 1] }
    },
    { upsert: true }
  ).catch(err => console.error('Failed to update MongoDB budget:', err));

  return state;
}

export async function recordBlockedCall(sessionId) {
  const state = await getBudgetState(sessionId);
  state.blockedCalls += 1;
  budgetCache.set(sessionId, state);

  BudgetTracker.findOneAndUpdate(
    { sessionId },
    { $inc: { blockedCalls: 1 } },
    { upsert: true }
  ).catch(err => console.error('Failed to update MongoDB blocked calls:', err));
}

export async function resetBudget(sessionId) {
  const newState = { spent: 0, calls: 0, blockedCalls: 0, history: [] };
  budgetCache.set(sessionId, newState);

  await BudgetTracker.findOneAndUpdate(
    { sessionId },
    { $set: newState },
    { upsert: true }
  );
  
  return newState;
}

export async function getAllBudgetStats(sessionId) {
  const state = await getBudgetState(sessionId);
  const mode = await getBudgetMode(sessionId);
  
  return {
    spent: state.spent,
    remaining: Math.max(0, SESSION_BUDGET - state.spent),
    total: SESSION_BUDGET,
    percentUsed: (state.spent / SESSION_BUDGET) * 100,
    mode,
    calls: state.calls,
    blockedCalls: state.blockedCalls,
    history: state.history.slice(-20),
  };
}
