# TECHNICAL — Interregnum

Legend: ✅ verified from official docs on 2026-10-18 · ⚠️ verify before use.

## 1. Architecture at a glance

```
┌────────────────────────── Web (Vercel Hobby / Cloudflare Pages) ──────────────────────────┐
│ L5  Owner Console · Contact Portal · Receipts Timeline · Return Brief  (Next.js + Motion)  │
└───────────────▲───────────────────────────────────────────────────────────▲───────────────┘
                │ REST/SSE                                                  │ magic-link
┌───────────────┴──────────── API / Orchestrator (Next.js route handlers) ───┴───────────────┐
│ L4  Vigil state machine · Two-person trigger · Playbook compiler · Receipt signer           │
└───────┬───────────────────────┬─────────────────────────────┬──────────────────────────────┘
        │ SQL                   │ HTTPS (OpenAI-compatible)   │ HTTPS via tunnel
┌───────▼─────────┐   ┌─────────▼───────────────┐   ┌──────────▼───────────────────────────────┐
│ L6 Postgres      │   │ L2 Nebius Token Factory  │   │ L1 Hermes Agent (memory, skills, cron)   │
│ (Supabase/Neon   │   │ Nemotron tier router     │   │ inside L0 NemoClaw/OpenShell sandbox     │
│  free)           │   │ + Tavily (verify)        │   │ policy.yaml ← compiled from playbook     │
└──────────────────┘   └──────────────────────────┘   └──────────────────────────────────────────┘
                                                        │ only allowed hosts (mock vendor, SMTP sink)
```

### Layers

| Layer | Responsibility | Tech |
|---|---|---|
| L0 Sandbox | Hard enforcement: network, filesystem, process | NemoClaw (`nemohermes` CLI) + OpenShell; Landlock/seccomp/netns ✅ |
| L1 Agent | Executes playbook steps, remembers context, runs skills, schedules | Hermes Agent ✅ |
| L2 Brain | Reasoning via tiered models | Nebius Token Factory + NVIDIA Nemotron ✅ |
| L3 Knowledge | Vendor verification, contact-page lookup | Tavily (free 1,000 credits/mo) ✅ |
| L4 Orchestrator | State machine, compile policy, trigger logic, receipts | TypeScript (Next.js route handlers) |
| L5 Experience | Owner/contact UI | Next.js, Tailwind v4, Motion |
| L6 Data | Users, playbooks, policies, events, receipts | Postgres (Supabase or Neon free) ⚠️ |
| L7 Observability | Logs of Token Factory calls, sandbox denials | Structured logs → receipts table |

## 2. Stack decisions (2026)

| Concern | Choice | Why |
|---|---|---|
| Frontend/API | Next.js (App Router) + TypeScript | One repo, free hosting on Vercel Hobby ⚠️ |
| Styling/motion | Tailwind v4, `motion` package, CSS custom properties, canvas/SVG for lantern | See `DESIGN.md` |
| DB | Postgres on Supabase or Neon free tier; SQLite fallback for local | ⚠️ confirm current free limits |
| LLM client | `openai` SDK pointed at Token Factory | OpenAI-compatible ✅ |
| Schema validation | `zod` | Strict JSON from compiler |
| Sandbox host | Team Linux machine with Docker; expose Hermes API via Cloudflare Tunnel (free) | NemoClaw needs a container runtime ✅ |
| Email | Sandbox SMTP sink (e.g. MailHog) + Resend free for real contact messages ⚠️ | Keep demo safe |
| Mock vendor | Tiny Express/Hono service we host ("Voltaic Energy") | No real money |

**Everything the demo depends on is free-tier.** Hero tech (Token Factory credits, Tavily free) stays free. Do not add paid services.

## 3. Model tiering (Token Factory)

Base URL ✅: `https://api.tokenfactory.nebius.com/v1/` (OpenAI-compatible). Auth: `Authorization: Bearer <NEBIUS_API_KEY>` ⚠️ confirm header in quickstart.

| Tier | Model ID ⚠️ (confirm in `/v1/models`) | Used for |
|---|---|---|
| Heavy | `nvidia/Nemotron-3-Ultra-550b-a55b` | Rare: policy risk review ("red team my own policy"), Return Brief polish |
| Standard | `nvidia/nemotron-3-super-120b-a12b` | Playbook → policy compilation, agent reasoning |
| Light | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Classification, check-in copy, receipts text |
| Vision | `nvidia/Nemotron-3-Nano-Omni` | Reading a bill photo (confirm input support) |

```ts
// lib/llm.ts
import OpenAI from "openai";

export const tf = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY!,
});

export const MODELS = {
  heavy: "nvidia/Nemotron-3-Ultra-550b-a55b",
  standard: "nvidia/nemotron-3-super-120b-a12b",
  light: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  vision: "nvidia/Nemotron-3-Nano-Omni",
} as const;

type Tier = keyof typeof MODELS;

export async function ask(tier: Tier, system: string, user: string, json = false) {
  const res = await tf.chat.completions.create({
    model: MODELS[tier],
    temperature: 0.2,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });
  // log for receipts/observability
  console.log(JSON.stringify({ evt: "tf_call", tier, model: MODELS[tier], usage: res.usage }));
  return res.choices[0].message.content ?? "";
}
```

Routing rule: start Light; escalate to Standard if output fails zod validation; Heavy only for the "policy red-team" step and only once per playbook approval.

## 4. Sandbox: NemoClaw + OpenShell

### Install (✅ from the NVIDIA quickstart)

```bash
# interactive
curl -fsSL https://www.nvidia.com/nemoclaw.sh | NEMOCLAW_AGENT=hermes NEMOCLAW_SANDBOX_NAME=interregnum bash

# defer onboarding until credentials are ready
curl -fsSL https://www.nvidia.com/nemoclaw.sh | NEMOCLAW_AGENT=hermes bash -s -- --defer-onboarding
nemohermes onboard            # also: --resume, --fresh
```

Point inference at Token Factory using a **custom OpenAI-compatible provider** ✅:

```bash
export NEMOCLAW_PROVIDER=custom
export COMPATIBLE_API_KEY=$NEBIUS_API_KEY
# endpoint + model prompts: https://api.tokenfactory.nebius.com/v1/  and the Standard-tier model ID
# ⚠️ exact endpoint env var name is on the "Choose an Inference Provider" page
nemohermes inference set --model nvidia/nemotron-3-super-120b-a12b --provider custom   # switch later without rebuild
```

Operate (✅):

```bash
nemohermes interregnum status
nemohermes interregnum dashboard-url --quiet       # default http://127.0.0.1:18789/
nemohermes launch interregnum                      # Hermes TUI
nemohermes interregnum connect                     # shell inside sandbox
curl -sf http://127.0.0.1:8642/health              # API health
nemohermes interregnum gateway-token --quiet       # bearer for the API
nemohermes interregnum recover                     # after reboot
```

Hermes exposes an OpenAI-compatible API at `http://127.0.0.1:8642/v1` ✅ — our orchestrator calls this (via Cloudflare Tunnel) to run playbook steps.

Caveats ✅: first start pulls an image (minutes); ports 18789 / 8642 must be forwarded; Hermes web search supports **Tavily only**; Node ≥ 22.19 for the coding-agent credential helper path; `inference set` restarts the gateway (avoid during a demo run). Also noted earlier ⚠️: pin a compatible OpenShell version, and watch installer PATH issues.

### Policy schema (✅ from the OpenShell reference)

- `version: 1` (required)
- **Static** (needs sandbox recreate): `filesystem_policy` (`include_workdir`, `read_only[]`, `read_write[]`), `landlock.compatibility` (`best_effort` | `hard_requirement`), `process.run_as_user/group` (not root)
- **Dynamic** (`openshell policy set`): `network_policies` map → each has `name`, `endpoints[]`, `binaries[]`
- Endpoint: `host` (wildcards ok), `port`, `protocol: rest` (enables HTTP inspection), `enforcement: enforce|audit`, `access: read-only|read-write|full` **or** `rules[] { allow: { method, path, query? } }`, `deny_rules[]` (win over allow), `allowed_ips[]`
- Binary: `path` (globs ok)

**Design consequence:** per-playbook rules are *network_policies* (dynamic) so we can swap them at activation without rebuilding the sandbox. Filesystem/process settings are fixed baseline.

### Baseline + generated policy example

```yaml
version: 1
filesystem_policy:
  include_workdir: true
  read_only: [/usr, /lib, /etc]
  read_write: [/sandbox, /tmp]
landlock:
  compatibility: hard_requirement
process:
  run_as_user: sandbox
  run_as_group: sandbox

network_policies:
  # compiled from playbook "pay-electricity"
  pb_pay_electricity:
    name: pb-pay-electricity
    endpoints:
      - host: mock.voltaic.interregnum.dev   # mock vendor we host
        port: 443
        protocol: rest
        enforcement: enforce
        rules:
          - allow: { method: GET,  path: "/accounts/*/balance" }
          - allow: { method: POST, path: "/accounts/*/payments" }
        deny_rules:
          - { method: DELETE, path: "/**" }
    binaries:
      - path: /usr/bin/curl
      - path: /usr/bin/node
  # Tavily is the only sanctioned web lookup
  tavily:
    name: tavily
    endpoints:
      - host: api.tavily.com
        port: 443
        protocol: rest
        access: read-write
    binaries:
      - path: /usr/bin/node
```

⚠️ The schema has no native "max amount" field. **Spend caps are enforced in our mock vendor/API layer and in the skill**, and the policy restricts which endpoints are reachable. Say this honestly in the demo: sandbox bounds *where*, the application layer bounds *how much*.

Credentials ⚠️: OpenShell keeps keys in its provider store, exposed to the sandbox via placeholders. Confirm the placeholder syntax from the OpenShell docs; never put real keys in `policy.yaml` or the repo.

Applying a policy (⚠️ confirm CLI flags): `openshell policy set <sandbox> --policy policy.yaml`.

## 5. Playbook compiler (L4)

Input: playbook JSON from the form + NL intent. Output: validated `CompiledPlan`.

```ts
// lib/schemas.ts
import { z } from "zod";

export const Playbook = z.object({
  id: z.string(),
  title: z.string(),
  intent: z.string(),                       // plain English
  hosts: z.array(z.string()).min(1),        // owner-approved domains
  actions: z.array(z.enum(["read","pay","email","calendar_note"])),
  maxSpendMinor: z.number().int().nonnegative(),   // pence/cents
  currency: z.string().length(3),
  expiresAt: z.string().datetime(),
  notify: z.array(z.string().email()),
});

export const CompiledPlan = z.object({
  playbookId: z.string(),
  steps: z.array(z.object({
    id: z.string(), skill: z.string(), summary: z.string(),
    needsHumanApproval: z.boolean(),
  })),
  policyYaml: z.string(),
  riskNotes: z.array(z.string()),
  humanSummary: z.object({
    canReach: z.array(z.string()),
    cannotReach: z.string(),
    maxSpend: z.string(),
    expires: z.string(),
  }),
});
```

```ts
// lib/compile.ts
import { ask } from "./llm";
import { CompiledPlan, Playbook } from "./schemas";
import { verifyVendor } from "./tavily";

export async function compile(pb: z.infer<typeof Playbook>) {
  // 1. Verify each host really belongs to the named vendor
  const checks = await Promise.all(pb.hosts.map(verifyVendor));
  if (checks.some(c => !c.ok)) throw new Error("Vendor verification failed");

  // 2. Draft plan + policy with the Standard tier, strict JSON
  const raw = await ask("standard", COMPILER_PROMPT, JSON.stringify({ pb, checks }), true);
  let plan = CompiledPlan.safeParse(JSON.parse(raw));
  if (!plan.success) { /* retry once, then escalate or fail loudly */ }

  // 3. Deterministic guard: policy hosts ⊆ pb.hosts (never trust the model)
  assertHostsSubset(plan.data.policyYaml, pb.hosts);

  // 4. Optional red-team with Heavy tier
  const review = await ask("heavy", REDTEAM_PROMPT, plan.data.policyYaml);
  return { ...plan.data, riskNotes: [...plan.data.riskNotes, review] };
}
```

**Rule:** the model proposes, deterministic code disposes. `assertHostsSubset` parses YAML and rejects any host not in the owner-approved list.

## 6. Tavily usage (bonus: Best Use of Tavily)

Endpoints ✅: search, extract, map, crawl, research. Free tier ~1,000 credits/month ✅.

Where it earns its place (not decorative):
1. **Vendor verification at setup:** `extract` the vendor's official page, `search` for scam/lookalike signals, confirm the domain matches what the owner typed.
2. **Contact discovery at runtime:** `map` the vendor's site to find the correct support/payments page before drafting a notice.
3. **Return Brief citations:** attach source URLs to claims.

```ts
// lib/tavily.ts  (⚠️ confirm request shape in Tavily docs)
export async function verifyVendor(host: string) {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    body: JSON.stringify({ query: `${host} official site billing`, max_results: 5 }),
  });
  const data = await r.json();
  const official = data.results?.some((x: any) => new URL(x.url).hostname.endsWith(host));
  return { host, ok: !!official, sources: data.results?.map((x: any) => x.url) ?? [] };
}
```

## 7. Vigil state machine & two-person trigger

States: `WATCHING → CONCERNED → AWAITING_CONTACT → ACTIVE → RETURNED` (+ `PAUSED`).

```ts
// lib/vigil.ts
export type State = "WATCHING"|"CONCERNED"|"AWAITING_CONTACT"|"ACTIVE"|"RETURNED"|"PAUSED";

export function nextState(s: {
  state: State; lastCheckIn: Date; cadenceH: number; graceH: number;
  missedThreshold: number; contactConfirmedAt?: Date; contactDeclinedAt?: Date; now: Date;
}): State {
  const hoursSince = (s.now.getTime() - s.lastCheckIn.getTime()) / 36e5;
  const missed = Math.floor(Math.max(0, hoursSince - s.graceH) / s.cadenceH);

  if (s.state === "ACTIVE" && hoursSince < s.cadenceH) return "RETURNED";
  if (s.state === "WATCHING" && missed >= 1) return "CONCERNED";
  if (s.state === "CONCERNED" && missed >= s.missedThreshold) return "AWAITING_CONTACT";
  if (s.state === "AWAITING_CONTACT") {
    if (s.contactDeclinedAt) return "WATCHING";
    if (s.contactConfirmedAt) return "ACTIVE";          // two-person rule satisfied
  }
  if (hoursSince < s.cadenceH && s.state !== "ACTIVE") return "WATCHING";
  return s.state;
}
```

Scheduling: a Vercel Cron (Hobby is limited ⚠️) or Hermes cron inside the sandbox calling `/api/vigil/tick` every 15 min. Prefer Hermes cron as it showcases the sponsor feature ✅.

## 8. Executing a playbook

1. On `ACTIVE`, orchestrator applies each approved playbook's policy (`openshell policy set`) via the sandbox host agent.
2. Orchestrator calls Hermes API (`/v1/chat/completions`, model = Hermes route) with the playbook plan; Hermes picks skills from `skills/`.
3. Each skill ends by emitting a **receipt** (see `skills/write-receipt`).
4. Denials from OpenShell surface as errors to the skill, which records `DENIED`.
5. On expiry or `RETURNED`, policies are revoked.

## 9. Receipts

```ts
type Receipt = {
  id: string; playbookId: string; stepId: string;
  at: string;                         // ISO
  action: "read"|"pay"|"email"|"calendar_note";
  status: "ALLOWED"|"DENIED"|"NEEDS_HUMAN";
  policyRule?: string;                // e.g. pb_pay_electricity.rules[1]
  amountMinor?: number; currency?: string;
  evidence: { url?: string; response?: string; sources?: string[] };
  model: { tier: string; id: string };
  hash: string;                       // sha256(prevHash + canonical JSON)
};
```

Hash-chain receipts so tampering is visible; display the chain status in the UI.

## 10. Data model (Postgres)

```sql
create table owners(id uuid primary key, email text unique, cadence_h int, grace_h int, missed_threshold int);
create table contacts(id uuid primary key, owner_id uuid references owners, email text, confirmed_at timestamptz, declined_at timestamptz);
create table playbooks(id uuid primary key, owner_id uuid references owners, json jsonb, policy_yaml text, approved_at timestamptz, expires_at timestamptz);
create table vigil(owner_id uuid primary key references owners, state text, last_check_in timestamptz);
create table receipts(id uuid primary key, owner_id uuid, playbook_id uuid, body jsonb, hash text, prev_hash text, at timestamptz default now());
```

## 11. API surface (orchestrator)

| Route | Purpose |
|---|---|
| `POST /api/checkin` | Reset vigil |
| `POST /api/playbooks` | Create + compile |
| `POST /api/playbooks/:id/approve` | Owner approval |
| `POST /api/playbooks/:id/dryrun` | Run against mock vendor |
| `GET /api/contact/:token` / `POST .../confirm` | Contact flow |
| `POST /api/vigil/tick` | Cron entry |
| `GET /api/receipts` (SSE) | Live timeline |
| `GET /api/brief` | Return Brief |

## 12. Environment variables

```
NEBIUS_API_KEY=
TAVILY_API_KEY=
DATABASE_URL=
SANDBOX_API_URL=        # Cloudflare Tunnel URL → Hermes :8642
SANDBOX_API_TOKEN=      # from `nemohermes <name> gateway-token --quiet`
APP_BASE_URL=
RESEND_API_KEY=         # optional
```

Never commit `.env`. Ship `.env.example`.

## 13. Repo layout (target)

```
/apps/web            Next.js app (L4+L5)
/packages/core       schemas, vigil, compile, receipts
/sandbox             policy templates, baseline.yaml, onboarding script
/skills              Hermes skills (copied into sandbox)
/mock-vendor         Fake utility provider
/docs                these steering docs
```

## 14. Day-1 smoke tests (do before anything else)

- [ ] One `chat.completions` call to each Token Factory tier; save `/v1/models` output
- [ ] Try an image through the Omni model
- [ ] `nemohermes onboard` completes; `/health` returns OK
- [ ] Apply a trivial policy; confirm a disallowed host is blocked
- [ ] One Tavily search + extract
- [ ] Cloudflare Tunnel reaches `:8642` with bearer token
