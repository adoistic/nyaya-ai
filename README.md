# Nyaya.ai — podcast site

A single-page GitHub Pages site for the **Nyaya.ai** podcast (law × AI), hosted by
Talha Abdul Rahman & AI. Refined ink-and-gold "digital jurisprudence" design with
proper Devanagari typography for the Hindi episode titles.

- **Spotify show:** https://open.spotify.com/show/2xOfA7OxdOrmujP8QyBoyr
- **RSS feed:** https://anchor.fm/s/fccefafc/podcast/rss

## How it works

- A build step ([scripts/fetch-episodes.mjs](scripts/fetch-episodes.mjs)) reads the
  podcast's **public RSS feed** and writes a static `episodes.json` — all episodes,
  with titles, descriptions, dates, durations, and cover art. **No API token, no
  secret, no scraping.**
- [index.html](index.html) renders that JSON as native episode cards, and also
  embeds Spotify's official player for inline playback.
- If `episodes.json` is missing (e.g. the feed is temporarily unreachable), the
  page gracefully falls back to the embedded player alone.

## Deploy (GitHub Pages)

1. Push these files to a repo's `main` branch.
2. In **Settings → Pages → Build and deployment**, set **Source: GitHub Actions**.
3. Push (or run the workflow from the **Actions** tab). The workflow builds
   `episodes.json` from RSS and deploys. It also re-runs daily (cron) so new
   episodes appear automatically.

## Refresh the episode list locally

```bash
node scripts/fetch-episodes.mjs   # rewrites episodes.json from the RSS feed
```

Point it at a different feed with an env var:

```bash
PODCAST_RSS="https://example.com/feed.xml" node scripts/fetch-episodes.mjs
```

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

| Path | Purpose |
|------|---------|
| `index.html` | The entire site (HTML + CSS + JS, self-contained). |
| `scripts/fetch-episodes.mjs` | Builds `episodes.json` from the RSS feed (Node 18+, no deps). |
| `episodes.json` | Generated episode data (66 episodes). |
| `.github/workflows/deploy.yml` | Builds from RSS + deploys to Pages; refreshes daily. |
| `.nojekyll` | Tells Pages to serve files as-is. |
