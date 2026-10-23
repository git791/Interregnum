# PRD — Interregnum

Owner: Product (see `TEAM.md`). Status: v0.1, steering. Last updated: 2026-10-18.

## 1. Problem

When someone is suddenly unreachable (hospital, accident, remote travel, bereavement), small obligations keep ticking: rent, utilities, work notices, subscriptions, pet/plant care, a landlord who needs a reply. Giving a relative your passwords is risky; doing nothing causes real damage. Existing tools are either dead-man switches that only send a message, or general agents with unbounded access.

## 2. Product in one sentence

Pre-authorize bounded playbooks; if you go silent **and** a trusted contact confirms, an AI agent carries them out inside a sandbox whose rules were compiled from your playbook, and logs a receipt for each action.

## 3. Users

| Persona | Need |
|---|---|
| **Owner** (freelancer, student abroad, solo parent) | Peace of mind; control over exactly what can happen |
| **Trusted Contact** (partner, sibling, friend) | Confirm the situation without getting account access; see what is happening |
| **Judge/Reviewer** | Understand the idea in 3 minutes and see the sandbox enforcing limits live |

## 4. Core concepts

- **Playbook:** plain-English intent + structured limits (hosts, max spend, allowed actions, expiry, notify list).
- **Compiled policy:** OpenShell YAML generated from the playbook, shown to the owner for approval.
- **Vigil:** the watching state. Owner checks in on a cadence; misses escalate.
- **Activation:** requires (a) N missed check-ins and (b) Trusted Contact confirmation (two-person rule). Optional owner "panic" shortcut.
- **Receipt:** immutable record of each action: what, why, policy rule used, cost, evidence.
- **Hard limits:** see `README.md`.

## 5. User journeys

### J1 — Setup (Owner, ~5 min)
1. Sign in, set check-in cadence (e.g. every 48h) and grace period.
2. Invite Trusted Contact (magic link).
3. Create a playbook: "If I'm out, pay electricity bill up to £120 on provider X and email my manager the template."
4. Interregnum asks clarifying questions, verifies the vendor domain with Tavily, compiles a policy.
5. Owner reviews a human-readable diff: *Can reach: x.com POST /pay. Cannot reach: anything else. Max £120. Expires in 14 days.* Approves.
6. Dry-run in sandbox against mock endpoints; owner sees receipts.

### J2 — Vigil (ongoing)
Dashboard shows a lantern that dims as the next check-in approaches. One-tap check-in resets it.

### J3 — Activation
1. Check-ins missed → state `WATCHING → CONCERNED`.
2. Trusted Contact gets a message: "Ayaan hasn't checked in for 3 days. Confirm?" They see *only* that, not playbook contents.
3. Contact confirms → state `ACTIVE`. Rejection or owner check-in → back to `WATCHING`.
4. Agent runs approved playbooks; each step emits a receipt; contact sees the timeline.

### J4 — Return
Owner checks in; state returns to `WATCHING`; a **Return Brief** summarizes everything done, spend, anything refused, and anything needing a decision.

### J5 — Refusal
If the agent is asked for something outside policy (or a hard limit), the sandbox denies it and the receipt shows `DENIED` with the rule. This is a feature we show on screen in the demo.

## 6. Scope

### Must (MVP for demo)
- Owner auth, check-in, vigil state machine
- Playbook create → compile → approve
- Trusted-contact confirmation flow
- Hermes agent running in NemoClaw sandbox executing at least 2 playbooks (email-notice draft/send to sandbox mailbox; mocked bill payment against a mock vendor we host)
- Receipts timeline with allowed/denied
- Return Brief
- Tavily vendor verification during setup
- Token Factory Nemotron tiering used at runtime

### Should
- Nemotron Omni used to read a photo of a bill (confirm Omni input via Token Factory on day 1)
- Live policy visualisation (graph of allowed hosts)
- Dry-run mode

### Won't (hackathon)
- Real money movement, real bank integrations
- Medical/legal decisions
- Mobile apps
- Multi-tenant production hardening

## 7. Success metrics (for the demo)

- Time to approve a playbook < 5 minutes.
- 100% of agent actions have receipts.
- At least one visible DENIED event in the demo.
- Judge can reproduce via README in < 10 minutes.

## 8. Judging alignment checklist

- [ ] Runtime call to Token Factory visible in logs/demo
- [ ] At least one NVIDIA open model (Nemotron)
- [ ] Track fit: personal assistant with memory, skills, autonomy (Hermes)
- [ ] Tavily used meaningfully (not decorative)
- [ ] Public repo + OSI licence + demo URL + ≤3 min video + feedback form

## 9. Risks

| Risk | Mitigation |
|---|---|
| NemoClaw install friction (Node/Docker/PATH) | Install on day 1; pin versions; keep fallback of Hermes in plain Docker with the same policy file documented |
| Token Factory region/account block | Create account today; test one call |
| Free-tier limits | Tier models; cache; mock external vendors |
| Safety optics (AI handling money) | Mock vendors, spend caps, two-person rule, hard limits visible |
| Remote hosting of sandbox | Run on a team machine + Cloudflare Tunnel; web app on free host |

## 10. Open questions (resolve by Oct 20)

1. Where does the sandbox host run for the public demo URL? (team laptop vs free VM)
2. Does Omni accept image/video on Token Factory?
3. Exact credential placeholder syntax in OpenShell providers.
4. Notification channel for the contact: email only, or Telegram via Hermes gateway?
