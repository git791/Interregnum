---
name: vigil-checkin
description: Write calm, clear check-in nudges and trusted-contact confirmation messages.
---
# Vigil Check-in
## When to use
When the vigil state changes to CONCERNED or AWAITING_CONTACT.
## Inputs
Owner first name, hours since last check-in, contact name, confirmation link.
## Steps
1. Use the Light tier model to draft a short, warm message.
2. Contact message includes only: owner name, time since last check-in, Confirm / Not yet link. No playbook contents.
3. Send via configured mail sink/provider.
## Guardrails
No alarmist language. Never state the owner is in danger. Never include sensitive details.
## Receipt
`action: email`, recipients hashed in the receipt body.
