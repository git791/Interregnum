---
name: pay-bill
description: Pay a bill at a mock vendor within the playbook's spend cap (demo only; no real money).
---
# Pay Bill (mock)
## When to use
Playbook step with `action: pay` against a verified, policy-allowed host.
## Inputs
Account id, amount (minor units), currency, playbook cap and remaining budget.
## Steps
1. GET balance (allowed by policy).
2. If amount > remaining cap → `NEEDS_HUMAN`.
3. POST payment.
4. Confirm response; update remaining budget.
## Guardrails
Application layer enforces the cap (the sandbox policy cannot). Never retry a payment without checking idempotency key. Any DELETE or unexpected endpoint is denied by policy; record and stop.
## Receipt
`action: pay`, amount, currency, policy rule, response id.
