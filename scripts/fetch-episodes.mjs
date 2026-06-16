// Build-time episode fetcher — reads the podcast's public RSS feed and writes
// a static episodes.json that index.html renders as native cards.
//
// No Spotify API, no token, no secret, no scraping: the show owner enabled the
// RSS feed in Spotify for Creators (Settings → Availability → RSS Distribution),
// so the full catalogue is available from one public URL. Runs anywhere with
// Node 18+ (global fetch) — including GitHub Actions — with zero config.

import { writeFile } from "node:fs/promises";

const FEED = process.env.PODCAST_RSS || "https://anchor.fm/s/fccefafc/podcast/rss";
const OUT = "episodes.json";

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
};

const attr = (block, tag, name) => {
  const m = block.match(new RegExp(`<${tag}[^>]*\\b${name}="([^"]*)"`, "i"));
  return m ? m[1] : "";
};

const stripHtml = s =>
  s.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

const durationToMs = d => {
  if (!d) return 0;
  if (/^\d+$/.test(d.trim())) return parseInt(d, 10) * 1000;       // plain seconds
  const p = d.split(":").map(Number);                              // HH:MM:SS or MM:SS
  while (p.length < 3) p.unshift(0);
  return ((p[0] * 3600) + (p[1] * 60) + p[2]) * 1000;
};

try {
  const res = await fetch(FEED, { headers: { "User-Agent": "NyayaSite/1.0" } });
  if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
  const xml = await res.text();

  const channelImage = attr(xml, "itunes:image", "href");
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  const episodes = items.map(it => {
    const pub = pick(it, "pubDate");
    const date = pub ? new Date(pub) : null;
    const desc = stripHtml(pick(it, "description") || pick(it, "itunes:summary"));
    return {
      name: stripHtml(pick(it, "title")),
      description: desc,
      release_date: date && !isNaN(date) ? date.toISOString().slice(0, 10) : "",
      duration_ms: durationToMs(pick(it, "itunes:duration")),
      url: pick(it, "link"),
      audio: attr(it, "enclosure", "url"),
      image: attr(it, "itunes:image", "href") || channelImage,
    };
  });

  episodes.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
  await writeFile(OUT, JSON.stringify(episodes, null, 2));
  console.log(`✓ Wrote ${episodes.length} episodes to ${OUT} (from RSS)`);
} catch (err) {
  console.error("✗ Failed to build episodes from RSS:", err.message);
  console.error("  The site will fall back to the embedded Spotify player.");
  process.exit(0); // don't fail the deploy
}
