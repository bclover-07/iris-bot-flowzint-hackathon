import { Session } from '../models/Session.model.js';
import { SecurityLog } from '../models/SecurityLog.model.js';
import { getAllBudgetStats } from '../services/budget.service.js';

export async function getAnalyticsDashboard(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const trackingId = userId.toString();

    // 1. Get Budget Tracker for the user
    const budgetStats = await getAllBudgetStats(trackingId);
    
    // Fetch rich history from ALL Session models for this user
    const allSessions = await Session.find({ userId }).sort({ createdAt: -1 });
    let richHistory = [];
    
    allSessions.forEach(session => {
      if (session && Array.isArray(session.messages)) {
        const sessionHistory = session.messages
          .filter(m => m && m.role === 'assistant' && m.routing)
          .map(m => {
            const userMsg = session.messages[session.messages.indexOf(m) - 1];
            return {
              id: m._id,
              timestamp: m.timestamp || session.createdAt || new Date().toISOString(),
              query: userMsg ? userMsg.content : 'Unknown Query',
              model: m.routing?.modelDisplayName || m.routing?.model || 'Kimi K2.6',
              tier: m.routing?.tier || 'simple',
              cost: Number(m.cost || 0),
              costSavings: m.costSavings || { actualCost: Number(m.cost || 0), worstCaseCost: 0, saved: 0, savedPercent: 0 },
              tokens: m.tokens || { input: 0, output: 0 },
              latencyMs: m.latencyMs || 0,
              routingReason: m.routing?.reason || 'Direct processing',
              analysisBreakdown: m.routing?.analysisBreakdown || null,
              sentiment: m.sentiment || null,
            };
          });
        richHistory = [...richHistory, ...sessionHistory];
      }
    });

    // Sort richHistory by timestamp descending safely
    richHistory.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    // 2. Aggregate Model Usage & Savings from ALL-TIME richHistory
    const modelDistribution = {};
    let totalCost = 0;
    let worstCaseCost = 0;

    richHistory.forEach(h => {
      const modelName = h.model || 'Unknown';
      modelDistribution[modelName] = (modelDistribution[modelName] || 0) + 1;
      totalCost += Number(h.cost || 0);
      worstCaseCost += Number(h.costSavings?.worstCaseCost || (h.cost ? h.cost * 1.5 : 0.001)); 
    });

    const totalCostSafe = isNaN(totalCost) ? 0 : totalCost;
    const worstCaseCostSafe = isNaN(worstCaseCost) ? totalCostSafe : Math.max(worstCaseCost, totalCostSafe);
    const savedCostSafe = Math.max(0, worstCaseCostSafe - totalCostSafe);
    const savingsPercentSafe = worstCaseCostSafe > 0 ? (savedCostSafe / worstCaseCostSafe) * 100 : 0;

    // 3. Complexity Distribution
    const complexityBuckets = {
      simple: richHistory.filter(h => h.tier === 'simple').length,
      medium: richHistory.filter(h => h.tier === 'medium').length,
      complex: richHistory.filter(h => h.tier === 'complex').length,
    };

    return res.json({
      summary: {
        totalCalls: richHistory.length,
        totalCost: Number(totalCostSafe.toFixed(6)),
        savedCost: Number(savedCostSafe.toFixed(6)),
        savingsPercent: Number(savingsPercentSafe.toFixed(1)),
      },
      budget: budgetStats || { total: 2.0, spent: 0, remaining: 2.0, percentUsed: 0, mode: 'normal' },
      modelDistribution,
      complexityBuckets,
      recentHistory: richHistory,
    });
  } catch (err) {
    console.error('Analytics controller error:', err);
    next(err);
  }
}

export async function getSecurityDashboard(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

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
      if (Array.isArray(log.matchedPatterns)) {
        log.matchedPatterns.forEach(pattern => {
          if (pattern && pattern.label) {
            categoryBreakdown[pattern.label] = (categoryBreakdown[pattern.label] || 0) + 1;
          }
        });
      }
    });

    return res.json({
      summary: {
        totalBlocked,
        totalSuspicious,
        shieldStatus: totalBlocked > 0 ? 'active_blocking' : 'monitoring',
        savedBySecurity: Number((totalBlocked * 0.005).toFixed(4)),
      },
      layerBreakdown,
      categoryBreakdown,
      recentEvents: logs.slice(0, 20),
    });
  } catch (err) {
    console.error('Security controller error:', err);
    next(err);
  }
}
