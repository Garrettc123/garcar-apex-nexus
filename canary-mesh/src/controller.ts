import policy from '../config/canary-policy.json';
import type { Decision, GateSnapshot, StageName } from './types';

const stageIndex = (stage: StageName) => policy.trafficStages.findIndex((entry) => entry.name === stage);

export function evaluatePromotion(stage: StageName, metrics: GateSnapshot): Decision {
  const reasons: string[] = [];
  const gate = policy.gates;

  if (metrics.duplicateEmailDetected) reasons.push('duplicate_email');
  if (metrics.duplicateChargeDetected) reasons.push('duplicate_charge');
  if (metrics.invalidWebhookSignatureDetected) reasons.push('invalid_webhook_signature');
  if (metrics.eventLedgerDivergenceDetected) reasons.push('event_ledger_divergence');
  if (reasons.length) return decision('rollback', stage, reasons, metrics);

  if (metrics.http5xxRate > gate.maxHttp5xxRate) reasons.push('http_5xx_rate_exceeded');
  if (metrics.webhookFailureRate > gate.maxWebhookFailureRate) reasons.push('webhook_failure_rate_exceeded');
  if (metrics.p95LatencyMs > gate.maxP95LatencyMs) reasons.push('p95_latency_exceeded');
  if (metrics.duplicateEventRate > gate.maxDuplicateEventRate) reasons.push('duplicate_event_rate_exceeded');
  if (metrics.unverifiedWebhookRate > gate.maxUnverifiedWebhookRate) reasons.push('unverified_webhook_rate_exceeded');
  if (gate.requireSingleLead && !metrics.singleLeadPassed) reasons.push('single_lead_test_failed');
  if (gate.requireTenLead && !metrics.tenLeadPassed) reasons.push('ten_lead_test_failed');
  if (gate.requireReconciliation && !metrics.reconciled) reasons.push('event_reconciliation_failed');

  if (reasons.length) return decision('hold', stage, reasons, metrics);
  if (stage === 'production') return decision('hold', stage, ['already_at_full_traffic'], metrics);
  return decision('promote', stage, ['all_canary_gates_passed'], metrics);
}

export function nextStage(stage: StageName): StageName | null {
  const index = stageIndex(stage);
  const next = policy.trafficStages[index + 1];
  return (next?.name as StageName | undefined) ?? null;
}

function decision(action: Decision['action'], stage: StageName, reasons: string[], metrics: GateSnapshot): Decision {
  return { action, stage, reasons, evidence: { evaluatedAt: new Date().toISOString(), metrics, policyVersion: policy.version } };
}
