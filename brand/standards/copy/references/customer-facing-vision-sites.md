# Customer-facing vision sites

Use this when Caleb asks for a website/demo to make a product or venture vision concrete for partners, clients, or a strategy meeting.

## Core lesson

Do not default to an internal strategy page just because the audience includes partners. If Caleb says the site should make the vision grounded and easy to understand, build the artifact as the **customer-facing public website** first, then keep the internal strategy packet as a secondary asset.

## Default shape

1. Lead with the public buyer promise, not the deal thesis.
   - Example: “AI practice-growth operator for chiropractic clinics.”
   - Avoid ownership, partnership, licensing, equity, internal roadmap, and meeting agenda language above the fold.
2. Make the product legible and visually credible in the first screen.
   - Hero promise with restrained sizing. If the headline dominates the whole page, shrink it and let the product visual carry more of the weight.
   - Plain-language subhead.
   - A real hero graphic, product-preview card, simulated UI, animation, or short product-film module. Do **not** ship a text-first hero with generic cards when Caleb asked for high-value design.
   - One concrete CTA.
   - If the product is an “agent” or “digital employee,” make the job description concrete: what it does, what it replaces, what it saves, and what it helps the buyer/team do next.
3. Use workflow sections that show the mechanism.
   - Problem/pain.
   - How it works.
   - Operator/product in action.
   - Tangible weekly/monthly outputs the buyer receives.
   - Pilot or first offer.
   - Safety/compliance boundary where relevant.
   - FAQ.
4. Replace generic proof with concrete sample deliverables when real proof is not yet approved.
   - Do not invent testimonials, logos, metrics, or case studies.
   - If Caleb asks for case studies/testimonials/visual proof but approved proof does not exist yet, create **clearly labeled proof slots** and **field-note case-file modules** instead of fake quotes or fake results.
   - Show assets the product produces: memo, scorecard, huddle agenda, scripts, follow-up card, campaign brief, approval log, report, dashboard, checklist, or decision memo.
   - Make proof visual: case-file cards, revenue-chain diagrams, before/after workflow maps, scorecards, operator notes, and “proof needed” labels.
   - This makes the value feel real without fake proof.
5. If the industry is healthcare-adjacent, include a clear data boundary.
   - Clinic-level growth operations can be shown with aggregate or de-identified examples.
   - Patient-level automation requires approved secure setup before turning on.
   - Keep human approval before external outreach visible.
   - Avoid broad “HIPAA compliant” claims unless the legal/compliance basis is already verified.
6. Remove demo/internal/AI-slop tells before handoff.
   - Search for: `demo`, `concept page`, `for tomorrow`, `internal`, `commercial shape`, `not a checkout page`, `TRP deal structure`, `TODO`, `FIXME`, placeholder pricing, “replace this later,” “AI slop,” “dashboard theater,” “spreadsheet swamp,” “dashboard PhD,” and “test a toy.”
   - If a CTA is not wired, phrase it like a real early-access CTA instead of saying it is fake.
   - Remove meta-commentary about the page’s purpose; the page should read like a real company site.
7. Run an adversarial website-strategist pass before showing Caleb when he asks for high-value design or complains about AI slop.
   - Ask for a verdict: `SHIP` / `REVISE BEFORE SHOWING`.
   - Have the critic inspect first-screen clarity, premium feel, generic SaaS patterns, weak proof, compliance risk, internal tells, and exact rewrite suggestions.
   - Apply must-fix items, then run a post-fix audit.
8. Verify like a shipped page.
   - HEAD-check the served URL and every local asset that matters: video, poster image, CSS/JS bundle, downloadable file.
   - Browser-open the Tailscale URL.
   - Click at least one interactive element.
   - Check console/body text for bad terms.
   - Confirm served file matches disk when possible.
   - Run runtime checks for videos/canvases/animations: media `readyState`, intrinsic dimensions, canvas CSS size vs drawing size, and whether animated/reveal elements are actually visible.
   - Avoid scroll-reveal implementations that initialize content at opacity 0 unless you verify every module becomes visible in visual QA. Prefer visible-by-default with subtle animation.
   - Run visual QA above the fold and at least one lower section. Full-page visual QA should show no giant blank sections caused by hidden content or unloaded media.
   - Update the task ledger only after the live URL and artifact are verified.

## Good output posture

Recommendation-first handoff:
- Give the verified URL.
- State what changed in positioning.
- List what was verified.
- Ask the next strategic questions only after the artifact is live.

## Pitfall

An internal strategy demo can be useful, but it does not ground the vision the same way a customer-facing homepage does. For tomorrow-style partner meetings, show the world the customer would see first; use the packet second.