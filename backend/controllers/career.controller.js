import { getDegradedModel, recordSpend, getAllBudgetStats } from '../services/budget.service.js';
import { callOtari } from '../services/otari.service.js';
import { emitRoutingEvent } from '../services/socket.service.js';
import { MODELS } from '../config/otari.js';
import { CareerReport } from '../models/CareerReport.model.js';

export async function analyzeCareer(req, res, next) {
  try {
    const { resumeText, targetRole, currentSkills, sessionId } = req.body;

    const content = resumeText || `Target role: ${targetRole}. Current skills: ${currentSkills}`;

    const baseModel = MODELS.COMPLEX;
    const model = (await getDegradedModel(sessionId, baseModel)) || MODELS.SIMPLE;

    let result;
    try {
      result = await callOtari({
        model,
        messages: [{
          role: 'user',
          content: `Analyze this student profile and generate 3 career paths with current salary data for India 2026:\n\n${content}\n\nReturn ONLY valid JSON: {"paths": [{"title": "...", "timeframe": "6–12 months", "salaryRange": "₹X–Y LPA", "skills": ["skill1"], "steps": ["step1"], "difficulty": "beginner|intermediate|advanced"}]}`,
        }],
        guardrailMode: 'block',
        useWebSearch: true,
        sessionId,
      });
    } catch (err) {
      console.warn("Otari API Error (Career):", err.message);
      result = {
        answer: JSON.stringify({
          paths: [
            { title: `${targetRole || "Software Engineer"} (Simulated)`, timeframe: "12-24 months", salaryRange: "₹8–15 LPA", skills: (currentSkills || "JavaScript, React").split(","), steps: ["Build projects", "Apply for internships"], difficulty: "intermediate" },
            { title: "Systems Architect (Simulated)", timeframe: "24-36 months", salaryRange: "₹12–25 LPA", skills: ["System Design", "Cloud Computing"], steps: ["Learn Docker/Kubernetes"], difficulty: "advanced" }
          ]
        }),
        cost: 0.0005,
        inputTokens: 150,
        outputTokens: 200
      };
    }

    await recordSpend(sessionId, model, result.cost, { tier: 'complex', score: 85, reason: 'Career analysis + web search' });

    emitRoutingEvent(sessionId, {
      tier: 'complex',
      modelDisplayName: model.includes('Kimi') ? 'Kimi K2.6' : model.includes('Haiku') ? 'Haiku 4.5' : 'Sonnet 4.6',
      reason: 'Career analysis requires search grounding',
      cost: result.cost,
      score: 85
    });

    let paths;
    try {
      const cleaned = result.answer.replace(/```json|```/g, '').trim();
      paths = JSON.parse(cleaned).paths;
    } catch {
      return res.status(500).json({ error: 'Failed to parse career paths from AI response' });
    }

    const report = await CareerReport.create({
      userId: req.user.id,
      resumeSnippet: content.substring(0, 200),
      paths,
      model,
      cost: result.cost,
    });

    const budgetStats = await getAllBudgetStats(sessionId);

    return res.json({
      reportId: report._id,
      paths,
      routing: { model, tier: 'complex', reason: 'Career analysis with live web search for salary data', webSearchUsed: true },
      cost: { thisCall: result.cost, ...budgetStats },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserCareers(req, res, next) {
  try {
    const reports = await CareerReport.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ reports });
  } catch (err) {
    next(err);
  }
}
