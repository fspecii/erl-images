import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { isBlocked } from "./blocklist.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const ASPECT_FILTERS = {
  landscape: "+filterui:aspect-wide",
  portrait: "+filterui:aspect-tall",
  square: "+filterui:aspect-square",
  any: "",
};

const SIZE_FILTERS = {
  large: "+filterui:imagesize-large",
  medium: "+filterui:imagesize-medium",
  small: "+filterui:imagesize-small",
  wallpaper: "+filterui:imagesize-wallpaper",
  any: "",
};

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "for", "with", "about", "from", "and", "or", "in",
  "on", "at", "to", "is", "are", "photo", "image", "picture", "hd", "best",
  "top", "uk", "london",
]);

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Scrape Bing Images and return direct, non-blocked image URLs.
 * Uses the `/images/async` endpoint (JSON `m=` cells) with a `murl` regex fallback.
 */
export async function searchImages(query, options = {}) {
  const { count = 8, aspect = "landscape", size = "large" } = options;

  const qft = encodeURIComponent(
    (ASPECT_FILTERS[aspect] ?? "") + (SIZE_FILTERS[size] ?? "+filterui:imagesize-large"),
  );
  const url =
    `https://www.bing.com/images/async?q=${encodeURIComponent(query)}` +
    `&qft=${qft}&first=0&count=${Math.max(count * 6, 30)}&mmasync=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`Bing images HTTP ${res.status} for "${query}"`);
  }
  const html = await res.text();

  const found = new Set();

  const iuscRe = /class="iusc"[^>]*\sm="([^"]+)"/g;
  let m;
  while ((m = iuscRe.exec(html)) !== null) {
    try {
      const meta = JSON.parse(decodeEntities(m[1]));
      if (meta.murl && /^https?:\/\//.test(meta.murl)) found.add(meta.murl);
    } catch {
      /* skip malformed cell */
    }
  }

  if (found.size === 0) {
    const decoded = html.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const murlRe = /[";]murl[":]?\s*[:=]\s*"?(https?:\/\/[^"&;,\s]+)/g;
    while ((m = murlRe.exec(decoded)) !== null) {
      found.add(m[1].replace(/\\u002f/gi, "/").replace(/\\\//g, "/"));
    }
  }

  const clean = [...found].filter(
    (u) => /\.(jpe?g|png|webp)/i.test(u) && !isBlocked(u),
  );

  const keywords = extractKeywords(query);
  if (keywords.length > 0) {
    const relevant = clean.filter((u) => {
      const lower = u.toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    });
    const ranked = [...relevant, ...clean.filter((u) => !relevant.includes(u))];
    return ranked;
  }

  return clean;
}

async function processImage(buffer, opts) {
  const { webp, quality, width, minWidth, minHeight } = opts;
  const img = sharp(buffer, { failOn: "error" });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) return null;
  if (meta.width < minWidth || meta.height < minHeight) return null;

  let pipeline = img.rotate();
  let outWidth = meta.width;
  let outHeight = meta.height;

  if (width && meta.width > width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
    outHeight = Math.round((meta.height * width) / meta.width);
    outWidth = width;
  }

  if (webp) {
    return {
      ext: "webp",
      data: await pipeline.webp({ quality }).toBuffer(),
      width: outWidth,
      height: outHeight,
    };
  }

  const ext = meta.format === "png" ? "png" : "jpg";
  const data =
    ext === "png"
      ? await pipeline.png().toBuffer()
      : await pipeline.jpeg({ quality }).toBuffer();
  return { ext, data, width: outWidth, height: outHeight };
}

function slugify(str, max = 40) {
  return (
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "image"
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Files already saved for a prefix, keyed by their embedded content hash.
 * The 12-hex-char hash makes the match exact, so prefix "chelsea" never
 * collides with "chelsea-harbour".
 */
function existingFiles(outDir, prefix) {
  if (!fs.existsSync(outDir)) return [];
  const re = new RegExp(`^${escapeRegex(prefix)}-([0-9a-f]{12})\\.(webp|jpe?g|png)$`, "i");
  return fs
    .readdirSync(outDir)
    .map((name) => {
      const m = re.exec(name);
      return m ? { path: path.join(outDir, name), hash: m[1].toLowerCase() } : null;
    })
    .filter(Boolean);
}

async function describeFile(filePath, query) {
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(filePath).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch {
    /* leave zeroed if unreadable */
  }
  return {
    path: filePath,
    filename: path.basename(filePath),
    url: "",
    query,
    width,
    height,
    bytes: fs.statSync(filePath).size,
    cached: true,
  };
}

/**
 * Search Bing, download candidates, validate dimensions, convert to webp,
 * and write ready-to-ship files to `outDir`. Returns metadata for each saved file.
 */
export async function fetchImages(query, options = {}) {
  const {
    count = 1,
    outDir = "./images",
    aspect = "landscape",
    size = "large",
    minWidth = 640,
    minHeight = 400,
    webp = true,
    quality = 80,
    width = null,
    namePrefix = null,
    candidatesPerResult = 6,
    timeoutMs = 15000,
    overwrite = false,
    onLog = null,
  } = options;

  const log = (msg) => onLog && onLog(msg);

  fs.mkdirSync(outDir, { recursive: true });

  const prefix = namePrefix ? slugify(namePrefix) : slugify(query, 30);

  const seenHashes = new Set();
  const cached = [];
  if (!overwrite) {
    for (const file of existingFiles(outDir, prefix)) {
      seenHashes.add(file.hash);
      cached.push(await describeFile(file.path, query));
    }
  }

  if (cached.length >= count) {
    log(`cache hit: ${cached.length} existing for "${query}", skipping fetch`);
    return cached.slice(0, count);
  }

  const remaining = count - cached.length;
  if (cached.length > 0) {
    log(`${cached.length} cached, downloading ${remaining} more for "${query}"`);
  }

  const urls = await searchImages(query, { count: remaining * candidatesPerResult, aspect, size });
  log(`found ${urls.length} candidate urls for "${query}"`);

  const results = [];
  let attempts = 0;
  const maxAttempts = remaining * candidatesPerResult;

  for (const url of urls) {
    if (results.length >= remaining) break;
    if (attempts >= maxAttempts) break;
    attempts++;

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) continue;

      const contentHash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 12);
      if (seenHashes.has(contentHash)) continue;

      const processed = await processImage(buffer, { webp, quality, width, minWidth, minHeight });
      if (!processed) continue;

      seenHashes.add(contentHash);
      const filename = `${prefix}-${contentHash}.${processed.ext}`;
      const outPath = path.join(outDir, filename);
      fs.writeFileSync(outPath, processed.data);

      results.push({
        path: outPath,
        filename,
        url,
        query,
        width: processed.width,
        height: processed.height,
        bytes: processed.data.length,
        cached: false,
      });
      log(`saved ${filename} (${processed.width}x${processed.height})`);
    } catch {
      /* try next candidate */
    }
  }

  log(`validated ${results.length}/${remaining} new for "${query}" (${attempts} attempts)`);
  return [...cached, ...results];
}

export { isBlocked } from "./blocklist.js";
