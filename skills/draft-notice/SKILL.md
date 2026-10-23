---
name: draft-notice
description: Draft and send a short notice (e.g. to a manager or landlord) on the owner's behalf using an owner-approved template.
---
# Draft Notice
## When to use
Playbook step with `action: email` and an approved template.
## Inputs
Template id, recipient (must be in playbook `notify`), owner-approved facts.
## Steps
1. Fill the template; do not add new facts, dates or commitments.
2. Standard tier may polish tone only.
3. Send to allowed recipient only.
## Guardrails
No promises, no admissions, no medical details, no legal claims. If the template cannot cover the situation → `NEEDS_HUMAN`.
## Receipt
`action: email`, include final text hash.
