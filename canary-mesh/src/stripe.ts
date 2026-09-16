export type StripeIngressResult =
  | { ok: true; outcome: 'accepted' | 'duplicate'; eventId: string }
  | { ok: false; outcome: 'invalid_signature' | 'invalid_payload'; reason: string };

export function validateStripeIngress(input: {
  eventId?: string;
  signatureVerified: boolean;
  seenEventIds: Set<string>;
}): StripeIngressResult {
  if (!input.eventId) return { ok: false, outcome: 'invalid_payload', reason: 'missing_event_id' };
  if (!input.signatureVerified) return { ok: false, outcome: 'invalid_signature', reason: 'stripe_signature_not_verified' };
  if (input.seenEventIds.has(input.eventId)) return { ok: true, outcome: 'duplicate', eventId: input.eventId };
  input.seenEventIds.add(input.eventId);
  return { ok: true, outcome: 'accepted', eventId: input.eventId };
}
