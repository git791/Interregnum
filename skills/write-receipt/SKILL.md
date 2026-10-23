---
name: write-receipt
description: Emit a structured, hash-chained receipt after every agent action, including denials.
---
# Write Receipt
## When to use
After every action, success or failure. No exceptions.
## Inputs
Playbook id, step id, action, status (ALLOWED | DENIED | NEEDS_HUMAN), policy rule, amount, evidence, model tier.
## Steps
1. Build the receipt object (schema in `TECHNICAL.md §9`).
2. POST to orchestrator `/api/receipts` with the sandbox token.
3. Orchestrator computes `hash = sha256(prevHash + canonicalJSON)`.
## Guardrails
Never omit denials. Never include credentials or full message bodies; store hashes plus short excerpts.
## Receipt
This is the receipt skill.
