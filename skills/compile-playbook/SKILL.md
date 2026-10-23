---
name: compile-playbook
description: Orchestrator-side reference for turning an owner's playbook into a plan and OpenShell network policy. Not run inside the sandbox.
---
# Compile Playbook
## When to use
During playbook creation (journey J1), before owner approval.
## Inputs
Playbook JSON (`packages/core` `Playbook` schema), Tavily vendor checks.
## Steps
1. Verify each host (`vendor-verify` logic).
2. Standard-tier model emits `CompiledPlan` JSON (steps, policyYaml, humanSummary).
3. Validate with zod; retry once on failure.
4. Deterministic check: every host in `policyYaml` is in `playbook.hosts`; no wildcard hosts unless owner approved; only `network_policies` keys changed.
5. Heavy-tier red-team once; append `riskNotes`.
6. Show the owner the Can / Cannot / Max / Expires card.
## Guardrails
Never apply an unapproved policy. Never widen hosts beyond owner input.
## Receipt
`action: read`, status ALLOWED, evidence = vendor sources.
