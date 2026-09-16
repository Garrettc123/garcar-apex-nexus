# Garcar Connect Canary Mesh Controller

A deterministic, audit-friendly promotion gate for Garcar outreach and revenue workflows.

## Safety defaults

- Gmail is limited to an allowlisted test recipient during canary.
- LinkedIn is dry-run and requires a human approval boundary before any live action.
- Stripe is test-mode; live money movement is explicitly disabled during canary.
- Invalid Stripe signatures, duplicate emails, duplicate charges, and ledger divergence trigger rollback.
- Promotion requires a passing single-lead test, a passing 10-lead test, and event reconciliation.

## Release contract

`staging → canary-1 → canary-2 → canary-3 → canary-4 → canary-5 → production`

Traffic sequence: `0% → 1% → 5% → 10% → 25% → 50% → 100%`.

The controller decides only `promote`, `hold`, or `rollback`. It never performs provider calls. Provider adapters must implement signatures, idempotency keys, audit events, and explicit human approvals separately.

## Local verification

```bash
node --experimental-strip-types --test canary-mesh/test/controller.test.ts
```

## Production integration

1. Write every provider attempt and outcome to the canonical event ledger.
2. Build an aggregated `GateSnapshot` from a bounded time window.
3. Call `evaluatePromotion(stage, snapshot)`.
4. Apply a routing update only when the result is `promote` and an authorized release process accepts it.
5. On `hold` or `rollback`, freeze new canary admissions and preserve the trace evidence.
