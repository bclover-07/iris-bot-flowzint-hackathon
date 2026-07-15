import { Session } from '../models/Session.model.js';
import { SecurityLog } from '../models/SecurityLog.model.js';
import { BudgetTracker } from '../models/BudgetTracker.model.js';

export async function getAnalyticsDashboard(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;

    // 1. Get Budget Tracker for the user
    const tracker = await BudgetTracker.findOne({ sessionId: req.query.sessionId || 'demo-session-id' });
    
    // Fetch rich history from ALL Session models for this user
    const allSessions = await Session.find({ userId: userId }).sort({ createdAt: -1 });
    let richHistory = [];
    
    allSessions.forEach(session => {
      if (session && session.messages) {
        // Filter for assistant messages which have routing info
        const sessionHistory = session.messages
          .filter(m => m.role === 'assistant' && m.routing)
          .map(m => {
            // Find corresponding user message
            const userMsg = session.messages[session.messages.indexOf(m) - 1];
            return {
              id: m._id,
              timestamp: m.timestamp,
              query: userMsg ? userMsg.content : 'Unknown Query',
              model: m.routing.model,
              tier: m.routing.tier,
              cost: m.cost,
              costSavings: m.costSavings,
              tokens: m.tokens,
              latencyMs: m.latencyMs,
              routingReason: m.routing.reason,
              analysisBreakdown: m.routing.analysisBreakdown,
              sentiment: m.sentiment || null,
            };
          });
        richHistory = [...richHistory, ...sessionHistory];
      }
    });

    // Sort richHistory by timestamp descending
    richHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 2. Aggregate Model Usage & Savings from ALL-TIME richHistory
    const modelDistribution = {};
    let totalCost = 0;
    let worstCaseCost = 0;

    richHistory.forEach(h => {
      modelDistribution[h.model] = (modelDistribution[h.model] || 0) + 1;
      totalCost += h.cost || 0;
      worstCaseCost += h.costSavings?.worstCaseCost || ((250 / 1000000 * 3.00) + (300 / 1000000 * 15.00)); 
    });

    // 3. Complexity Distribution
    const complexityBuckets = {
      simple: richHistory.filter(h => h.tier === 'simple').length,
      medium: richHistory.filter(h => h.tier === 'medium').length,
      complex: richHistory.filter(h => h.tier === 'complex').length,
    };

    return res.json({
      summary: {
        totalCalls: richHistory.length,
        totalCost: parseFloat(totalCost.toFixed(6)),
        savedCost: parseFloat((worstCaseCost - totalCost).toFixed(6)),
        savingsPercent: worstCaseCost > 0 ? parseFloat((((worstCaseCost - totalCost) / worstCaseCost) * 100).toFixed(1)) : 0,
      },
      budget: tracker ? {
        total: tracker.total,
        spent: tracker.spent,
        remaining: Math.max(0, tracker.total - tracker.spent),
        percentUsed: (tracker.spent / tracker.total) * 100,
        mode: tracker.mode
      } : { total: 2.0, spent: 0, remaining: 2.0, percentUsed: 0, mode: 'normal' },
      modelDistribution,
      complexityBuckets,
      recentHistory: richHistory, // Send the full rich history
    });
  } catch (err) {
    next(err);
  }
}

export async function getSecurityDashboard(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;

    const logs = await SecurityLog.find({ userId }).sort({ timestamp: -1 }).limit(100);

    const totalBlocked = logs.filter(l => l.action === 'blocked').length;
    const totalSuspicious = logs.filter(l => l.action === 'passed' && l.threatLevel === 'suspicious').length;

    const layerBreakdown = {
      local: logs.filter(l => l.detectionLayer === 'local' && l.action === 'blocked').length,
      piguard: logs.filter(l => l.detectionLayer === 'piguard').length,
      response: logs.filter(l => l.detectionLayer === 'response').length,
    };

    const categoryBreakdown = {};
    logs.forEach(log => {
      log.matchedPatterns.forEach(pattern => {
        categoryBreakdown[pattern.label] = (categoryBreakdown[pattern.label] || 0) + 1;
      });
    });

    return res.json({
      summary: {
        totalBlocked,
        totalSuspicious,
        shieldStatus: totalBlocked > 0 ? 'active_blocking' : 'monitoring',
        savedBySecurity: parseFloat((totalBlocked * 0.005).toFixed(4)), // Est avg cost avoided
      },
      layerBreakdown,
      categoryBreakdown,
      recentEvents: logs.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
}
