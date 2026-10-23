# CHECKLIST — Submission & schedule

Deadline: **Oct 30, 2026, 10:00 am PT.** Today: Oct 18.

## Hackathon requirements

- [ ] Runtime call to Nebius Token Factory (or run on Nebius AI Cloud) — visible in demo/logs
- [ ] At least one NVIDIA open model (Nemotron) used
- [ ] Track selected: **Personal AI**
- [ ] Public GitHub repo with visible OSI licence (MIT) + README
- [ ] Working demo URL
- [ ] YouTube demo video ≤ 3 minutes, public/unlisted as required
- [ ] Feedback form completed
- [ ] Bonus: Tavily meaningful use (Best Use of Tavily) — documented in README
- [ ] Re-read the official rules page for any change before submitting

## Schedule

| Dates | Goal |
|---|---|
| Oct 18–19 | Day-1 smoke tests (`TECHNICAL.md §14`), repo + licence, accounts (Token Factory, Tavily, Supabase/Neon, Vercel) |
| Oct 20–22 | Sandbox + policy apply/deny working; orchestrator skeleton; vigil state machine + tests |
| Oct 23–25 | Compile pipeline, mock vendor, skills, receipts chain; UI shell + lantern |
| Oct 26–27 | Contact flow, Return Brief, end-to-end run; **feature freeze Oct 27** |
| Oct 28 | Bug bash, deploy, README, demo rehearsal |
| Oct 29 | Record video, Devpost write-up, feedback form, submit (buffer) |
| Oct 30 | Final check before 10:00 am PT; do not start new work |

## Demo script (≤ 3 min)

1. (0:00) Hook: "What happens to your life when you can't run it?"
2. (0:20) Create playbook → Tavily verifies vendor → compiled policy card.
3. (0:50) Missed check-ins → contact confirms (two keys).
4. (1:20) Agent runs: ALLOWED payment receipt, ALLOWED notice, **DENIED** attempt (policy refuses).
5. (2:10) Show policy constellation + Token Factory tier logs.
6. (2:35) Owner returns → dawn Return Brief.
7. (2:50) Sponsor strip + repo URL.

## Pre-submit sanity

- [ ] Fresh clone follows README in < 10 min
- [ ] No secrets in git history
- [ ] Demo works from a clean browser
- [ ] Mock vendor clearly labelled as mock
- [ ] Every ⚠️ in docs resolved or called out in README "Known limitations"
