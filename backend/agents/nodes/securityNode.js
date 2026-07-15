import { detectInjection } from '../../services/injection.service.js';
import { recordBlockedCall } from '../../services/budget.service.js';
import { SecurityLog } from '../../models/SecurityLog.model.js';
import { emitRoutingEvent } from '../../services/socket.service.js';

/**
 * Node that runs prompt injection checks.
 * Logs security violations to DB and blocks processing.
 */
export async function securityNode(state) {
  const { message, sessionId, userId } = state;
  const trackingId = userId ? userId.toString() : (sessionId || 'demo-session-id');

  emitRoutingEvent(trackingId, {
    type: 'routing_step',
    step: 2,
    status: 'analyzing',
    message: 'Running security firewall checks (PIGuard)...',
    timestamp: new Date().toISOString()
  });

  const localInjectionResult = detectInjection(message);
  
  if (localInjectionResult.isInjection) {
    await recordBlockedCall(trackingId);
    
    await SecurityLog.create({
      sessionId,
      userId,
      promptSnippet: message.substring(0, 200),
      threatLevel: 'blocked',
      detectionLayer: 'local',
      matchedPatterns: localInjectionResult.matchedPatterns,
      heuristicFlags: localInjectionResult.heuristicFlags,
      confidence: localInjectionResult.confidence,
      action: 'blocked',
      cost: 0,
    });

    emitRoutingEvent(trackingId, {
      type: 'injection_blocked',
      message: message.substring(0, 50) + '...',
      timestamp: new Date().toISOString(),
    });

    return {
      injectionStatus: 'blocked',
      answer: 'Your message was flagged as a potential prompt injection attempt and blocked by the local security guardrail.',
      trace: ['securityNode']
    };
  }

  const status = localInjectionResult.threatLevel === 'suspicious' ? 'monitor' : 'clean';

  return {
    injectionStatus: status,
    trace: ['securityNode']
  };
}
