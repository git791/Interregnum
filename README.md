# Interregnum

> *interregnum (n.)* — the gap between one ruler and the next. For you: the days when you can't run your own life, and nobody has the keys.

**Interregnum is a personal AI that keeps your life running while you can't.** Hospital stay, off-grid trip, sudden emergency: you pre-authorize a small set of **playbooks** (pay the rent, tell my manager, renew the domain, feed the cat-sitter schedule). If you miss check-ins **and** a trusted person confirms, a Hermes agent executes them inside an **NVIDIA OpenShell sandbox** whose policy was *compiled from your playbook*. It can touch only the hosts, paths and amounts you approved, and it leaves a signed receipt for every step.

- **Track:** Personal AI (Nebius x NVIDIA Global AI Hackathon)
- **Deadline:** Oct 30, 2026, 10:00 am PT
- **Status:** Planning/steering docs only. Application code has not been started.

---

## Why it can win

| Judging criterion | How Interregnum answers it |
|---|---|
| Technological Implementation (tie-breaker) | Real runtime use of Nebius Token Factory (tiered Nemotron models), NemoClaw + OpenShell sandbox with generated YAML policy, Hermes Agent memory/skills/cron, Tavily for vendor verification |
| Design | Dusk/vigil visual language, animated lantern + receipt-tape UI (see `DESIGN.md`) |
| Potential Impact | Everyone has a "what if I'm unreachable for 10 days" problem; caregivers, solo workers, travellers |
| Quality of Idea | Delegation with *provable* limits: autonomy bounded by sandbox policy, not by prompt |

Sponsor tech used for real: **Nebius Token Factory**, **NVIDIA Nemotron**, **NemoClaw/OpenShell**, **Hermes Agent**, **Tavily** (bonus prize).

## Doc map (read in this order)

1. `README.md` — you are here
2. `PRD.md` — what we build, for whom, user journeys, scope
3. `TECHNICAL.md` — architecture, layers, stack, snippets, data model
4. `AGENTS.md` — rules for any AI coding agent or human dev working in this repo
5. `SKILLS.md` + `skills/*/SKILL.md` — Hermes runtime skills (the agent's playbook-execution abilities)
6. `DESIGN.md` — palette, fonts, motion, UX
7. `TEAM.md` — who owns what, rhythm to Oct 30
8. `CHECKLIST.md` — submission requirements and day-by-day plan

## 60-second mental model

```
Owner ──writes──▶ Playbook (plain English + limits)
                      │ compile (Nemotron Super, strict JSON)
                      ▼
              Policy.yaml (OpenShell) + Spending caps + Expiry
                      │
Missed check-ins ─┐   ▼
Trusted contact ──┴─▶ ACTIVATION (two-person rule)
                      │
                      ▼
        Hermes agent inside NemoClaw sandbox
        (can only reach hosts the policy allows)
                      │
                      ▼
        Receipt per action → Owner & contact see a timeline
```

## Quick links (external, verify before relying)

- Hackathon: https://nebiusglobalaihackathon.devpost.com/
- OpenShell policy schema: https://docs.nvidia.com/openshell/latest/reference/policy-schema
- NemoClaw Hermes quickstart: https://docs.nvidia.com/nemoclaw/user-guide/hermes/get-started/quickstart-hermes
- Token Factory docs: https://docs.tokenfactory.nebius.com/ (OpenAPI: https://api.tokenfactory.nebius.com/openapi.json)

## Licence

MIT (OSI-approved, required by the hackathon; add `LICENSE` at repo root on day 1).

## Hard limits (product promises)

1. No medical or legal decisions.
2. No irreversible action (large payments, deletions, contracts) without a human approving.
3. Every action is bounded by a compiled policy, a spend cap and an expiry.
4. The agent never sees raw credentials; they live in the OpenShell provider store.
