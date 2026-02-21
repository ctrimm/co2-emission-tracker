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

- [x] **`GET /stats` endpoint** — Returns pre-aggregated numbers (total scans, mean CO2,
  % green hosted) from the API. The homepage now calls `/stats` + `/trend` instead of
  downloading all emissions rows just to compute three numbers.

- [x] **Site submission form** (`/add-site`) — Form that builds a pre-filled GitHub
  issue URL so contributors can propose a new site without needing to know the repo
  structure. Validates the domain, strips protocol/www, and opens the issue in a new tab.

- [x] **All-sites trend chart on homepage** — 30-day average CO2 area chart on the
  homepage using the new `GET /trend` endpoint. Aggregates by date in the Lambda and
  passes the result as a static prop to `AreaChartWrapper` at build time.

- [x] **Leaderboard page** (`/leaderboard`) — Static page showing the top 10 cleanest
  and top 10 heaviest sites from the most recent nightly scan, with links to each site's
  detail page. Backed by a new `GET /leaderboard` endpoint.

## Backlog

- [ ] **Alerts / notifications** — After each nightly upsert, check whether a site's
  CO2 increased more than a configurable threshold (e.g. >20%) vs. the prior week and
  send an email or post a GitHub issue. Turns the tracker from a passive dashboard into
  something actionable.
