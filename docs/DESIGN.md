# DESIGN — Interregnum

## Concept: "The Dusk Vigil"

The product lives in the **in-between**: a lit lantern in a dusk sky, someone keeping watch while you're away. Calm, protective, a little ceremonial. Not corporate dashboard, not neon cyberpunk. Sponsors (NVIDIA, Nebius) are tech-forward, so we keep a precise, instrument-like layer (mono type, receipts) inside the warm, human shell.

No white or black backgrounds. The base is deep twilight indigo.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--dusk-950` | `#120F2B` | Page base (deep indigo, not black) |
| `--dusk-900` | `#1A1540` | Surfaces |
| `--dusk-800` | `#251E5C` | Raised cards |
| `--plum-600` | `#5B3A8C` | Gradient mid, borders on focus |
| `--rose-400` | `#E58BA8` | Horizon glow, secondary accent |
| `--lantern-400` | `#FFC06B` | **Primary accent**: the lantern, CTAs, "watching" |
| `--lantern-200` | `#FFE2B0` | Soft highlights, text on dark accent |
| `--mist-100` | `#E9E4F7` | Primary text (lavender-tinted, not white) |
| `--mist-300` | `#B9B0D6` | Secondary text |
| `--verify-500` | `#76B900` | "Sandbox verified / ALLOWED" (nod to NVIDIA green, used sparingly) |
| `--deny-500` | `#FF6B7A` | DENIED / hard limit |
| `--cyan-400` | `#5FD4E6` | Network/Tavily/Token Factory info chips (Nebius-cool counterpoint) |

Rules: lantern amber = human/attention; green = machine-verified safe; coral = refusal. Never use green for decoration.

Contrast: `mist-100` on `dusk-950` ≈ 14:1; `lantern-400` on `dusk-950` ≈ 10:1. Check any new pairing ≥ 4.5:1.

```css
:root{
  --dusk-950:#120F2B; --dusk-900:#1A1540; --dusk-800:#251E5C;
  --plum-600:#5B3A8C; --rose-400:#E58BA8;
  --lantern-400:#FFC06B; --lantern-200:#FFE2B0;
  --mist-100:#E9E4F7; --mist-300:#B9B0D6;
  --verify-500:#76B900; --deny-500:#FF6B7A; --cyan-400:#5FD4E6;
  --radius:18px;
}
body{ background:var(--dusk-950); color:var(--mist-100); }
```

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Fraunces** (variable, soft/wonk axes) | Warm, ceremonial serif; large sizes |
| UI / body | **Instrument Sans** | Clean, friendly, readable at small sizes |
| Receipts / policy / code | **JetBrains Mono** | The "instrument" layer: receipts, YAML, hashes |

All free on Google Fonts. Load with `display=swap`. Type scale: 14 / 16 / 20 / 28 / 44 / 72.

## Signature visuals & motion

1. **The Lantern (hero + vigil state):** SVG/canvas lantern with a breathing glow (4–6s ease-in-out). Brightness maps to time until next check-in. On check-in: warm flare. On `ACTIVE`: lantern swings slightly and a thread of light travels to the receipts.
2. **Living dusk sky:** slow animated gradient (dusk-950 → plum-600 → rose-400 horizon) with sparse drifting stars. Shifts hue subtly with vigil state (calmer when WATCHING, rosier when CONCERNED).
3. **Receipt tape:** receipts "print" one by one from a slot with a monospace typewriter reveal; ALLOWED stamps in green, DENIED stamps in coral with a small shake.
4. **Policy constellation:** allowed hosts rendered as stars connected to the central agent; denied attempts appear as a faint dashed line that snaps back. This shows the sandbox visually in the demo.
5. **Two-key moment:** the activation screen shows two keyholes (Missed check-ins / Contact confirmation); each lights up lantern-amber; when both are lit, a door-open transition.
6. **Return Brief:** the sky transitions to dawn (lantern fades to soft gold) — a emotional close for the demo.

Motion library: `motion` (React). Easing: custom `cubic-bezier(.22,.8,.2,1)` for reveals; durations 200–600ms UI, 4–6s ambient. Respect `prefers-reduced-motion` (disable ambient loops, keep opacity fades).

```tsx
// components/Lantern.tsx (illustrative snippet)
import { motion } from "motion/react";

export function Lantern({ level }: { level: number /* 0..1 */ }) {
  return (
    <motion.div
      aria-label={`Vigil ${Math.round(level*100)}% bright`}
      animate={{ opacity: [0.75, 1, 0.75], scale: [0.98, 1.02, 0.98] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: `drop-shadow(0 0 ${20 + level*40}px var(--lantern-400))` }}
    >
      {/* SVG lantern body */}
    </motion.div>
  );
}
```

## UI/UX principles

1. **Calm over urgent.** Even CONCERNED states use warm tones, plain language.
2. **Show the limits, not just the power.** Every playbook has a visible "Can / Cannot / Max / Expires" card.
3. **One decision per screen** during setup; progress shown as lantern lighting up.
4. **The contact sees less.** Minimal info, large confirm/decline, no playbook contents.
5. **Receipts are the product.** Timeline is first-class, never hidden in a log tab.
6. **Accessible:** keyboard navigable, ARIA labels on animated state, reduced-motion support, no information by colour alone (icons + text on ALLOWED/DENIED).

## Key screens

| Screen | Primary visual |
|---|---|
| Landing | Lantern + dusk sky, tagline, "Begin your vigil" |
| Setup wizard | Step lanterns; playbook card with Can/Cannot/Max/Expires |
| Policy review | Constellation of allowed hosts + YAML drawer (mono) |
| Vigil dashboard | Big lantern, next check-in countdown ring, one-tap check-in |
| Contact portal | Two-key screen, one calm paragraph, Confirm / Not yet |
| Active timeline | Receipt tape + constellation + spend meter |
| Return Brief | Dawn transition, summary, items needing decision |

## Sponsor presence (tasteful)

Footer/"How it works" strip: *Runs on Nebius Token Factory · Nemotron by NVIDIA · Sandboxed by NemoClaw/OpenShell · Verified with Tavily*. Use official logos only if licence allows ⚠️; otherwise text.

## Demo-video visual beats

0:00 lantern + hook → 0:20 playbook compile → 0:50 two-key activation → 1:20 receipt tape incl. a DENIED → 2:10 constellation + policy → 2:40 dawn Return Brief + sponsor strip.
