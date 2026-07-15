import { getAllBudgetStats, resetBudget } from '../services/budget.service.js';

export async function getBudgetStats(req, res, next) {
  try {
    const trackingId = req.user?.id || req.user?._id || req.params.sessionId;
    const stats = await getAllBudgetStats(trackingId);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function resetBudgetHandler(req, res, next) {
  try {
    const trackingId = req.user?.id || req.user?._id || req.params.sessionId;
    await resetBudget(trackingId);
    const stats = await getAllBudgetStats(trackingId);
    return res.json({ message: 'Budget reset for demo', stats });
  } catch (err) {
    next(err);
  }
}
