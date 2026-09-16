export type StageName = 'staging' | 'canary-1' | 'canary-2' | 'canary-3' | 'canary-4' | 'canary-5' | 'production';

export type GateSnapshot = {
  http5xxRate: number;
  webhookFailureRate: number;
  p95LatencyMs: number;
  duplicateEventRate: number;
  unverifiedWebhookRate: number;
  singleLeadPassed: boolean;
  tenLeadPassed: boolean;
  reconciled: boolean;
  duplicateEmailDetected?: boolean;
  duplicateChargeDetected?: boolean;
  invalidWebhookSignatureDetected?: boolean;
  eventLedgerDivergenceDetected?: boolean;
};

export type Decision = {
  action: 'promote' | 'hold' | 'rollback';
  stage: StageName;
  reasons: string[];
  evidence: Record<string, unknown>;
};

export type CanonicalEvent = {
  traceId: string;
  leadId: string;
  releaseId: string;
  environment: 'staging' | 'canary' | 'production';
  step: 'lead.intake' | 'lead.validate' | 'gmail.send' | 'linkedin.prepare' | 'linkedin.action' | 'reply.detect' | 'linear.update' | 'stripe.webhook.received' | 'stripe.webhook.verified' | 'stripe.event.reconciled';
  status: 'started' | 'succeeded' | 'failed' | 'skipped' | 'rolled_back';
  idempotencyKey: string;
  providerEventId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};
