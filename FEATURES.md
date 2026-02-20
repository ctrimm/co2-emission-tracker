# Features & Roadmap

Tracks planned features and their implementation status.

## In Progress / Completed

- [x] **Sitemap** — Re-enable `@astrojs/sitemap` so the hundreds of `/site/[website]`
  static pages are discoverable by search engines.

- [x] **Chart time-window toggle** — Add 7d / 30d / 90d toggle buttons on the site
  detail chart. The API already supports `?limit=` (1–90); this exposes it in the UI.

- [x] **Real industry averages** — Replace the hardcoded `0.5 g` placeholder with a
  per-industry lookup table (Government, Education, Healthcare, Finance, Technology,
  Media, Retail, Non-profit) so the "Compared to Industry Avg." stat card is accurate.

## Backlog

- [ ] **`GET /stats` endpoint** — Return pre-aggregated numbers (total scans, mean CO2,
  % green hosted) from the API instead of computing them on the client from the full
  `/emissions-unique` payload. Reduces homepage data transfer and makes the stats
  available to external callers.

- [ ] **Site submission form** — The hero CTA currently links to the GitHub repo. A
  simple form that opens a GitHub issue (or calls a Lambda that creates one via the
  GitHub API) would lower the barrier for adding a site without needing a PR.

- [ ] **All-sites trend chart on homepage** — Add a time-series chart to the homepage
  showing average CO2 across all monitored sites over the past 30 days. Makes the
  homepage more compelling and shows whether the web is getting greener over time.

- [ ] **Alerts / notifications** — After each nightly upsert, check whether a site's
  CO2 increased more than a configurable threshold (e.g. >20%) vs. the prior week and
  send an email or post a GitHub issue. Turns the tracker from a passive dashboard into
  something actionable.

- [ ] **Leaderboard page** — A `/leaderboard` route showing the top 10 cleanest and
  top 10 heaviest sites by average CO2. Shareable and link-worthy.
