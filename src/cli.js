#!/usr/bin/env node
import { fetchImages, searchImages } from "./index.js";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

const HELP = `erl-images — copyright-safe keyword image fetcher

Usage:
  erl-images "<keywords>" [options]

Options:
  --count N          number of images to save (default 1)
  --out DIR          output directory (default ./images)
  --aspect A         landscape | portrait | square | any (default landscape)
  --size S           large | medium | small | wallpaper | any (default large)
  --min-width N      minimum source width (default 640)
  --min-height N     minimum source height (default 400)
  --width N          resize down to this width (keeps aspect)
  --quality N        webp/jpeg quality 1-100 (default 80)
  --name PREFIX      filename prefix (default: slug of query)
  --no-webp          keep original format instead of converting to webp
  --overwrite        re-download even if matching files already exist (default: skip)
  --urls             print candidate URLs only, do not download
  --json             output result metadata as JSON
  -h, --help         show this help

Examples:
  erl-images "emergency plumber london" --count 3 --out ./public/assets/areas
  erl-images "victorian terraced house chelsea" --width 1200 --name chelsea
  erl-images "burst pipe water damage" --urls --count 5
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || args._.length === 0) {
    process.stdout.write(HELP);
    process.exit(args._.length === 0 ? 1 : 0);
  }

  const query = args._.join(" ");
  const count = args.count ? parseInt(args.count, 10) : 1;

  if (args.urls) {
    const urls = await searchImages(query, {
      count,
      aspect: args.aspect || "landscape",
      size: args.size || "large",
    });
    if (args.json) {
      process.stdout.write(JSON.stringify(urls, null, 2) + "\n");
    } else {
      urls.forEach((u) => process.stdout.write(u + "\n"));
    }
    return;
  }

  const results = await fetchImages(query, {
    count,
    outDir: args.out || "./images",
    aspect: args.aspect || "landscape",
    size: args.size || "large",
    minWidth: args["min-width"] ? parseInt(args["min-width"], 10) : 640,
    minHeight: args["min-height"] ? parseInt(args["min-height"], 10) : 400,
    width: args.width ? parseInt(args.width, 10) : null,
    quality: args.quality ? parseInt(args.quality, 10) : 80,
    namePrefix: typeof args.name === "string" ? args.name : null,
    webp: !args["no-webp"],
    overwrite: !!args.overwrite,
    onLog: args.json ? null : (msg) => process.stderr.write(`[erl-images] ${msg}\n`),
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
  } else if (results.length === 0) {
    process.stderr.write(`[erl-images] no usable images for "${query}"\n`);
    process.exit(2);
  } else {
    results.forEach((r) => process.stdout.write(r.path + "\n"));
  }
}

main().catch((err) => {
  process.stderr.write(`[erl-images] error: ${err.message}\n`);
  process.exit(1);
});
