# HTML Training Site Deliverable Pattern

Use when Caleb asks to turn a research pack, teardown, training doc, or markdown report into an HTML site.

## Default deliverable

Create a self-contained static site, not just raw markdown in a browser.

Recommended shape:
- `index.html` under a clear folder, e.g. `/<workspace>/<topic>-site/index.html`
- Embedded CSS/JS so the folder can be zipped and moved without dependency installs
- Hero section with title, source posture, key stats, and primary jump links
- Sticky/sidebar table of contents for long reports
- Carded content sections with readable tables and code blocks
- Print/save-PDF styles
- Zip package for handoff when useful

## Conversion workflow

1. Read the source markdown/report.
2. Preserve the analysis exactly unless Caleb asks for copy edits.
3. Convert headings to anchor-linked sections and build a sidebar TOC.
4. Style for scanability: dark/light theme appropriate to the brand, strong hierarchy, rounded cards, responsive tables, and visible callouts.
5. Include compliance/source-posture language when the site is based on competitor/public-source research.
6. Verify render in browser, not just file existence.
7. Check console/JS errors if any interaction exists.
8. If Caleb expects a viewable deliverable, serve it and verify a Tailscale hostname URL returns `200 OK`; do not give localhost/file URLs as the primary viewing link.
9. Provide both: verified URL + local HTML/zip attachments.

## Pitfalls

- Do not stop at “I made an HTML file” when Caleb asked for a site. Serve and verify it.
- Do not rely on missing local converters (`pandoc`, `markdown`) if unavailable; a small deterministic Python converter is fine for controlled markdown.
- Avoid Markdown local image syntax for local files in Hermes WebUI final responses. Use `MEDIA:/absolute/path`.
- Public competitive teardown sites should say “public-source pattern analysis,” not imply permission to copy private assets or claims.
