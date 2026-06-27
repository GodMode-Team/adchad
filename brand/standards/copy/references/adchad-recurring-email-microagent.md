# AdChad / recurring ad-critique micro-agent pattern

Use this when Caleb wants a funny, fast, revenue-shaped hackathon or micro-SaaS around ads, cold creative audits, or autonomous prospecting.

## Core product shape

AdChad.ai positioning:

> Go from Bad to Chad.

The core magic is **not** just a weekly email service. AdChad should be a self-prospecting AI micro-agency:

1. Find shitty public ads from small businesses on Facebook/Meta/X/public directories.
2. Score them for roastability, purchase likelihood, contactability, and public-post safety.
3. Draft a funny/useful public X roast tagging the business.
4. Draft a direct email to the business owner.
5. Sell the full roast feedback for **$5**.
6. One-click upsell the redesigned ad for **$19**.
7. Upsell recurring weekly help for **$49/mo**: “All it takes is one winner to pay for itself dozens of times over.”

Use Chad mascot/profile image when provided by Caleb. The visual direction should feel funny, memorable, and a little ugly-on-purpose, not polished SaaS mascot slop.

For real external posting/emailing, keep an approval queue until quality, deliverability, and brand safety are proven. The product vision can be autonomous; the first hackathon build should draft and queue outreach.

Do not overbuild a SaaS dashboard. The cleanest paid fulfillment ladder is:

- **$5 Chad Roast** — full roast feedback: weak spot, 3 stronger hooks, buyer-panel score, fix plan.
- **$19 Chad Fix** — redesigned static ad: headline/body/CTA, creative direction, before/after card, test note.
- **$49/mo Chad Gains** — 4 fresh ads/month, competitor pattern watch, weekly ready-to-test ad, no calls, inbox only.

Weekly $49 email sections:

1. **Chad's read** — blunt/funny diagnosis of the current ad/offer.
2. **Competitor pattern** — what Foreplay/competitor monitoring suggests is working in the niche.
3. **Chad Council** — synthetic ideal-customer critique: hook notice, offer clarity, trust, objections, and applied fix.
4. **Fresh ad** — headline, primary text/body, CTA.
5. **Creative direction** — static/video/image direction.
6. **Test note** — how to run the ad against the current control.

## ICP + prospecting reference

When building AdChad, do not assume inbound traffic. Use `references/adchad-prospecting-icp-and-hackathon-scorecard.md` for the full ICP, sourcing plan, scoring model, hackathon advisor criteria, and SynthCheck proof requirements.

Short version:
- Perfect ICP: owner-led small businesses spending roughly $1k-$30k/month on Meta ads, $300+ AOV/LTV, reachable through X/email, and running active but weak public ads.
- Best first verticals: med spas, gyms, home services, local clinics/wellness, niche ecommerce, coaches/creators with high-ticket offers.
- Main source: Meta Ad Library plus Google Maps/Yelp/directory seed lists; use X mainly for founder reachability and ad-performance pain signals.
- Hackathon demo should import 25 real prospects, score ICP fit + roastability, draft X/email outreach, run Stripe $5/$19/$49 checkout, fulfill the roast/redesign, and show SynthCheck before/after.

## Why the subscription works

The $5 roast and $19 one-off fix are curiosity/fulfillment proofs, but the recurring value is:

> fresh perspective every week + competitor monitoring + buyer-simulation feedback + ready-to-post ad.

The buyer does not need another dashboard. They need a usable ad in their inbox.

## Calculator frame

Put the ROI calculator on the site:

- AdChad cost: $49/mo
- Ads delivered: 4/month
- Average customer value: user input, default $1,500
- One extra customer from one winning ad pays for itself many times over

Copy line:

> If one ad gets you one extra customer, the math gets stupid fast.

## Credibility language

Use strong but supportable credibility:

- $10M+ in profitable ad spend/reps
- training from elite direct-response operators such as Curt Maly, Nicholas Kusmich, Brooke Castillo-style direct-response ecosystems, and others when accurate
- existing copy/ad skills, EBI refinement, and synthetic customer critique
- competitor monitoring through Foreplay/API or seeded Foreplay data for demo

Avoid unverifiable blanket claims like “world's top ad experts” unless names/proof are approved.

## Hackathon scope

Must build:

- landing page with hero, how it works, sample weekly email, calculator, pricing, checkout CTA
- signup intake form: URL, offer/current ad, ICP, competitors, tone, platform, email
- Stripe subscription: $49/mo
- post-checkout intake storage
- Hermes/Chad agent flow: competitor pattern, synthetic buyer critique, copy generation, EBI/quality pass, final weekly email
- one demo customer with a completed generated weekly email
- manual/admin run path or CLI command to regenerate the weekly email for demo

Do not build yet:

- dashboard
- complex accounts
- campaign publishing
- live ad spend
- complicated analytics
- prompt editor
- agency workflow platform
- anything that requires a week of auth plumbing

Rule: if it does not help someone subscribe or receive the first weekly ad, cut it.

## Jeremy-ready builder brief pattern

When Caleb asks for a site brief/spec for a builder or hackathon teammate, make the deliverable directly hackable, not just strategic. Prefer a self-contained static HTML brief with sections the builder can copy into implementation:

1. North star / win condition.
2. Product offer and pricing.
3. Hard MVP scope: must-build vs do-not-build-yet.
4. Public site copy and page skeleton.
5. User flow from landing → checkout → intake → generation → delivery.
6. Intake fields and why each exists.
7. Hermes/Chad agent prompt skeleton with exact output sections.
8. Sample weekly email that sells the product by showing the output.
9. ROI calculator formula and copy.
10. Simple data model and endpoints/commands.
11. Bite-sized builder task list.
12. Output quality gate to block generic AI ad copy.
13. Demo script and acceptance checklist.
14. Stretch ideas clearly separated from core.

For handoff quality, serve and verify the HTML if Caleb needs to share it. Provide a verified Tailscale URL plus a portable zip when useful. Update the handoff file if working in the shared Prosper/Claude workspace.

## Cara/chiro transfer

AdChad is the entertaining acquisition skin. The reusable machine is:

> public-signal prospecting + creative/acquisition leak diagnosis + buyer/avatar critique + ready-to-use fix + recurring fulfillment.

For Cara/TRP/chiro, re-skin the same engine as a serious practice-growth monitor:

- find chiropractors with weak public ads/sites/Google Business/Profile signals
- diagnose patient acquisition leaks
- create a better patient-growth ad/asset
- route strong-fit practices into Cara/TRP

Tone shift:

- AdChad: “Your ad skipped leg day.”
- Chiro/Cara: “We found public marketing leaks that may be costing consults.”

## Messaging anchors

- Go from Bad to Chad.
- Fresh ads. Weekly gains.
- No dashboard. Your inbox is the dashboard.
- We let fake customers roast your ad before real ones ignore it.
- Foreplay shows you the ads. AdChad tells you why they are beating yours and what to post next.
