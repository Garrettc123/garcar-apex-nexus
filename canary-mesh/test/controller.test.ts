import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePromotion, nextStage } from '../src/controller';
import { validateStripeIngress } from '../src/stripe';

const healthy = {
  http5xxRate: 0,
  webhookFailureRate: 0,
  p95LatencyMs: 250,
  duplicateEventRate: 0,
  unverifiedWebhookRate: 0,
  singleLeadPassed: true,
  tenLeadPassed: true,
  reconciled: true,
};

test('promotes a healthy canary stage', () => {
  const result = evaluatePromotion('canary-1', healthy);
  assert.equal(result.action, 'promote');
  assert.equal(nextStage('canary-1'), 'canary-2');
});

test('holds when ten-lead validation fails', () => {
  const result = evaluatePromotion('canary-2', { ...healthy, tenLeadPassed: false });
  assert.equal(result.action, 'hold');
  assert.ok(result.reasons.includes('ten_lead_test_failed'));
});

test('rolls back duplicate money or messaging risk', () => {
  const result = evaluatePromotion('canary-3', { ...healthy, duplicateChargeDetected: true });
  assert.equal(result.action, 'rollback');
  assert.ok(result.reasons.includes('duplicate_charge'));
});

test('rejects unverified Stripe ingress and deduplicates verified events', () => {
  const seen = new Set<string>();
  assert.equal(validateStripeIngress({ eventId: 'evt_1', signatureVerified: false, seenEventIds: seen }).ok, false);
  assert.equal(validateStripeIngress({ eventId: 'evt_1', signatureVerified: true, seenEventIds: seen }).outcome, 'accepted');
  assert.equal(validateStripeIngress({ eventId: 'evt_1', signatureVerified: true, seenEventIds: seen }).outcome, 'duplicate');
});
