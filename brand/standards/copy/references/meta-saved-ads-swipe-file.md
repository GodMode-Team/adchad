# Meta / Facebook Saved Ads → Swipe File

Use this when Caleb wants to turn Facebook saved ads or Meta ad assets into copy swipe files.

## Safety stance

Do **not** request or accept Caleb's Facebook password, 2FA code, cookies, or session export for this job. A personal Facebook login grants too much scope: DMs, Pages, payment methods, Business Manager, Instagram-linked assets, groups, saved items, settings, and identity controls.

If account restriction risk is unacceptable, do not automate Facebook's logged-in UI from a VPS/noVNC/browser. Unfamiliar server IPs, browser fingerprints, fast scrolling/clicking, and repetitive extraction can trigger checkpoint/rate-limit/scraping signals.

## Official export route for personal saved ads

Meta Help Center confirms saved items and collections are part of Facebook information export under **Saved Items and Collection**.

Recommended user steps:

1. Facebook → Settings & privacy
2. Settings
3. Accounts Center
4. Your information and permissions
5. Export your information
6. Create export
7. Select the Facebook profile
8. Export to device
9. Choose specific information: **Saved Items and Collection**
10. Date range: all time
11. Format: JSON when available
12. Start export
13. Download the ZIP when Facebook emails/notifies that it is ready
14. Provide the ZIP for local parsing

JSON is preferred because it is machine-readable. HTML is acceptable if JSON is unavailable, but parsing may be messier.

## Owned Page / ad account route

For Caleb's own ads and Pages, use scoped Meta OAuth / Meta Ads API access, not a personal login. Pull ad accounts, Pages, ads, creatives, copy, thumbnails, preview links, destination URLs, campaign/ad names, and insights where permitted.

## Swipe-file output schema

Minimum columns/fields:

- Advertiser / Page name
- Page URL
- Source URL / saved URL / ad URL
- Collection
- Saved date, if present
- Creative screenshot/path, if available
- Hook
- Angle
- Offer
- Mechanism
- Proof
- Audience
- CTA
- Landing page
- Swipe value: hook, offer, proof, visual, funnel, framing, etc.
- Reusable pattern
- Caleb notes / why saved

## Fallback when export is incomplete

1. Parse all URLs, titles, collection names, and timestamps from export.
2. Deduplicate by URL/ad ID/Page/domain.
3. Reconstruct advertiser/page data where possible.
4. Use public Meta Ad Library or public Page URLs for still-live examples.
5. Preserve unknowns instead of fabricating missing details.

## Recommendation language

For high-stakes accounts: "Use Facebook's official export. Do not run a live saved-ads scraper from a VPS. We'll parse the ZIP locally and rebuild the swipe file safely."
