# AdChad prospecting ICP + hackathon judging frame

Use when shaping AdChad.ai, autonomous ad-roast agents, or similar self-prospecting micro-agencies for hackathons/business demos.

## Hackathon frame

For the Nous/Hermes Agent Accelerated Business Hackathon, grade against agents that can **earn, spend, and run real business operations**. A landing page + generated sample is not enough.

Winning AdChad demo thesis:

> AdChad is an AI ad agency that prospects for itself: it finds bad ads, roasts them publicly, collects $5 through Stripe, fulfills the fix, and upsells the redesigned ad.

## Board / judging criteria

Score out of 100:

| Category | Points | First-place bar |
|---|---:|---|
| Autonomous business loop | 20 | Agent scans, scores, drafts outreach, routes payment, fulfills, and upsells. |
| Real revenue mechanics | 15 | Stripe test-mode works for $5, $19, and $49/mo; demo shows money path. |
| Usefulness of output | 15 | $5 roast and $19 redesign are genuinely better than original ad. |
| SynthCheck / quality proof | 10 | Before/after scores and synthetic buyer panel prove why the fix wins. |
| Demo clarity | 10 | 1-3 minute video makes the business loop obvious. |
| Brand memorability | 10 | Chad mascot, X roast format, and before/after visuals stick. |
| Technical execution | 10 | Working app, stored prospects/orders/fulfillments, no brittle handwaving. |
| Safety/trust | 5 | Approval queue, risk scoring, no reckless auto-posting. |
| Scale path | 5 | Clear path from 25 seeded prospects to high-volume scanning. |

Current AdChad spec is roughly **82/100 if built properly**. To reach 92+ / first-place territory, add: real prospect import, Stripe checkout, SynthCheck before/after, before/after visuals, and visible agent run log.

## Perfect ICP

One-sentence ICP:

> Owner-led small businesses spending roughly $1k-$30k/month on Meta ads, selling a product/service with $300+ AOV/LTV, reachable through X and/or email, with active public ads that are creatively weak.

Best-fit traits:

| Trait | Target |
|---|---|
| Business size | 2-50 employees, founder-led or small marketing team |
| Monthly ad spend | Estimated $1k-$30k/month from public proxies |
| Customer value | $300+ AOV/LTV minimum; ideally $750-$5k+ |
| Ad behavior | Active Meta ads, multiple creatives, or ads running 7+ days |
| Creative quality | Weak hook, generic offer, no proof, bad CTA, ugly but fixable visual |
| Reachability | X account, founder account, website email, contact form, LinkedIn, FB page |
| Buyer | Founder, owner, solo marketer, growth lead, small-brand media buyer |
| Purchase friction | $5 is instant, $19 is impulse, $49/mo is no-brainer if pain is real |

Best first verticals:

1. Med spas/aesthetic clinics — high LTV, many weak ads, needs careful claim posture.
2. Gyms/fitness studios/personal trainers — obvious hooks and local owner reachability.
3. Home services — roofers, HVAC, pest control, plumbing, remodelers; one job pays for Chad.
4. Local clinics/wellness — chiro, dental, IV therapy, functional medicine; keep claims safe.
5. Niche ecommerce brands — constant creative volume; founders often on X.
6. Coaches/creators/consultants — high-ticket and reachable, but higher cringe/reputation risk.

Avoid first:
- huge national brands;
- regulated finance/legal/political/social issue ads;
- no-contact businesses;
- tiny hobby shops with no ad consistency;
- dropship scam stores / shady supplements / get-rich offers;
- ads that are already strong.

## Finding the ads

Primary source: **Meta Ad Library** for public active Facebook/Instagram ads.

Best search paths:

1. Vertical + city:
   - `Austin med spa`
   - `Dallas roof repair`
   - `Denver personal trainer`
   - `Tampa dental implants`

2. Offer keywords:
   - `free estimate`
   - `book a consultation`
   - `new patient special`
   - `first visit`
   - `6 week challenge`
   - `transformation`

3. Google Maps / Yelp / directory combo:
   - Pull 25-50 businesses in one vertical/city.
   - Find their FB/IG page.
   - Search exact page name in Meta Ad Library.
   - Save active ad link/screenshot/text/start date.

4. X for reachability/founder discovery:
   - `"running Facebook ads" "my business"`
   - `"my Facebook ads" "not working"`
   - `"Meta ads" "small business"`
   - `"DTC" "Meta ads"`
   - `"founder" "Meta ads"`

Hackathon fast path: use a manual seed CSV of 25 real businesses/ad links, then let Chad rank and roast them. Live scraping/scanning is stretch.

Seed CSV fields:

```csv
business_name,vertical,city,website_url,facebook_page_url,x_handle,contact_email,ad_url,ad_text,source_notes
```

## ICP scoring model

Score every prospect 0-100:

```text
ICP Fit Score =
  25% Revenue potential
+ 20% Ad activity
+ 20% Creative weakness
+ 15% Reachability
+ 10% Founder/operator likelihood
+ 10% Safety/brand fit
```

Thresholds:
- 80+: roast now.
- 65-79: queue if volume is needed.
- 50-64: manual review.
- Under 50: skip.

## Prospecting workflow

1. Build seed list.
2. Check ad presence in Meta Ad Library.
3. Save active ad URL/screenshot/text/start date.
4. Score ICP fit and roastability.
5. Generate mini-roast: main leak, better hook, visual fix, X post draft, email draft, $5 CTA.
6. Human approval before public posting/email.
7. Stripe checkout.
8. Fulfill $5 roast, $19 redesign, $49/mo weekly upsell.

## Demo requirements to win

Build this exact flow:

1. Upload/import 25 real businesses.
2. Chad checks/scans public ad links.
3. Chad scores each business with ICP score + roastability score.
4. Dashboard shows top 5 prospects.
5. Click top prospect.
6. Chad shows original ad and diagnosis.
7. Chad drafts X roast and email.
8. Human approves draft.
9. Chad creates $5 Stripe link.
10. Payment success triggers $5 roast report.
11. Report includes $19 redesign upsell.
12. $19 success triggers redesigned ad and $49 weekly upsell.

The output must include visible SynthCheck:

```text
Original ad score: 42/100
Chad rewrite score: 79/100
Panel result: 4/5 prefer Chad
Biggest reason: clearer pain + stronger CTA
```

Panel personas:
- Distracted Scroller
- Skeptical Buyer
- Pain-Aware Prospect
- Performance Marketer
- Cheap Founder

## Pitfalls

- If the demo does not show Stripe/payment and fulfillment, it reads as hackathon theater.
- If prospects are all fake, it loses business credibility. Use real public examples where possible.
- Do not auto-post roasts or send emails in early demos. Queue for human approval.
- Public roast should be funny but not cruel. Roast the ad, not the owner.
- Text-only output is weak. Show original ad, Chad roast, before/after scorecard, redesigned ad preview, X preview, and email preview.
