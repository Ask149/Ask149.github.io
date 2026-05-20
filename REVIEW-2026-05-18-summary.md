# Site Review · localhost:4321 vs ask149.github.io

**May 18, 2026 — v2 update.** The site has evolved since this morning's v1 critique; a 5th reviewer observed the post-fix state and the consolidated punch list now reflects both. Original sources: `@ui-reviewer`, `@user-advocate`, `@creative-director`, an external literary 4th reviewer, plus the new 5th reviewer (editorial / semantics / receipts).

---

## TL;DR 🟠

- **Working:** The cream + terracotta palette and the Anton / Cormorant / JetBrains Mono trio still read as "bound printed journal" and nothing else looks like it. v1's hero, nav, and H1-text fixes have landed and should be protected.
- **Still blocking ship:** The rewritten H1 is one `<h1>` wrapping four generic blocks — visually fine, semantically a run-on for screen readers and search. The contact strip stops at email + LinkedIn (no GitHub, no Twitter). No prior-experience receipts are surfaced anywhere — a cold recruiter sees "senior" without proof. The WCAG contrast fail, mobile `clamp()`, focus rings, font payload, and the old Jekyll site at ask149.github.io all remain open from v1.
- **Meta-frame:** *"`localhost:4321` is the better website. `ask149.github.io` is the better résumé surface."* That gap is now closable in one 90-minute sprint.

---

## What's already been fixed since v1 ✅

- Dual-label nav — `Work · workshop`, `Travel · voyages`, `Reading · curio`, `Projects · atelier`
- Identity above the fold — portrait, "Currently in Seattle", email, LinkedIn
- H1 no longer says "vibe-coding" — name, role, tagline structure
- Portrait alt text is real (small thing, signals craft)

---

## What's working — protect, don't regress

Cream `#e8e5d8` + terracotta `#8b5a2a` palette. Anton / Cormorant Garamond / JetBrains Mono trio. 30px schematic grid. Persona-switching architecture. The "bound printed journal" voice. The `/changelog`, `ver. XIV`, `§1` flourishes — identity, not costume, *if* used consistently. All five reviewers converged on these.

---

## What the 5 reviewers now agree on

- **H1 markup is wrong** even though the text is right — one `<h1>` wrapping four `<generic>`s reads as a single blob to screen readers and search engines.
- **The site needs proof of the prior decade.** Tesla, Amazon, Barclays, Google intern, CERN-HSF are all absent. A senior-engineer claim with no receipts is asking for trust the page hasn't earned.
- **The "live" labels are charming when true and embarrassing when not.** Both `~ shipped today` and `● LIVE` need to be driven from real data or replaced with absolute dates. The two `LIVE` labels (sidebar + banner) should collapse to one.
- **The chip row promises an interaction.** Either wire it to actually filter, or rename the header to `tagged with` and stop promising.

---

## Top 5 next moves

- **Split the H1** into `<h1>name</h1>` + `<p>role</p>` + `<p>tagline</p>`, and tighten the tagline copy (`Shipping updates on Windows` → `Ships to Windows`; `Agentic AI enthusiast` → `Builds with agents`)
- **Add GitHub + Twitter** to the contact row (currently email + LinkedIn only — a senior-engineer site without visible GitHub asks recruiters to take the "studio" narrative on faith)
- **Add a one-line `Previously` strip** in the hero: *Previously: Microsoft · Tesla · Amazon · Barclays · Google · CERN-HSF.* Six names, no prose, ~24px of vertical space, enormous credibility for cold visitors. The recommended companion move is a `/resume` page as a vertical-timeline story (not a PDF link), with the same names rewritten in the new editorial voice.
- **Decide the chip-row promise** — wire a real interactive filter, or rename the header to `tagged with`
- **Resolve the old `ask149.github.io`** (still serving a stale "Intern @Tesla" bio under the same name) **and the WCAG contrast fail** on `#8b5a2a` (4.36:1, fails AA 4.5:1) — both carried over from v1, both still blocking

The first four are the 5th reviewer's "shortest possible next session" — a 90-minute sprint. Everything else on the full punch list is grace notes that can wait a week.

---

## What's next

The full v2 document (`REVIEW-2026-05-18.md`) carries the complete punch list re-sorted by status (✅ done, 🔴 blocker, 🟠 serious, ⚠️ open-needs-verification for v1 items the 5th reviewer didn't re-check, 🟡 minor), the full "Bringing the receipts back" strategic section with Options A / B / C, 16 verification gates, and an explicit "do not paste old prose verbatim into the new site" guardrail. It also ends with a copy-paste **meta-prompt for the developer LLM** that asks the dev LLM to first critique the review itself — verify claims against the live site, flag stale findings or missed blockers, and commit to a final prioritized punch list — before writing any code. Six open questions remain for Ashish: old-site fate, resume page structure, chip-filter decision, Card 002 decision, city framing, and the canonical resume artifact.

Window is tight: 14 days between today and the June 1 departure.

The site is good. These edits make it undeniable.
