# erl-images

Keyword-driven, **copyright-safe** image fetcher for building sites in bulk.

Give it keywords → it scrapes Bing Images (no API key), throws away anything from
a licensed/watermarked/competitor source via a hardened blacklist, validates
dimensions, converts to `.webp`, and drops ready-to-ship files in your asset
folder.

Built for the ERL network of local-service sites, where every page needs clean
imagery and hand-picking photos per page does not scale.

## Install

No registry needed — install straight from GitHub:

```bash
npm install github:fspecii/erl-images
```

Or globally, for the CLI:

```bash
npm install -g github:fspecii/erl-images
```

Requires Node ≥ 18. Ships `sharp` for image processing (no ffmpeg/cwebp needed).

## Library usage

```js
import { fetchImages } from "erl-images";

const images = await fetchImages("emergency plumber chelsea", {
  count: 3,
  outDir: "./public/assets/areas",
  width: 1200,          // resize down, keep aspect
  quality: 80,          // webp quality
  namePrefix: "chelsea",
});

// [
//   { path: "public/assets/areas/chelsea-a1b2c3d4e5f6.webp",
//     url: "...", width: 1200, height: 800, bytes: 84213, query: "..." },
//   ...
// ]
```

URLs only, no download:

```js
import { searchImages } from "erl-images";
const urls = await searchImages("victorian terraced house london", { count: 5 });
```

## CLI

```bash
erl-images "emergency plumber london" --count 3 --out ./public/assets
erl-images "burst pipe water damage" --width 1200 --name burst-pipe
erl-images "chelsea kings road" --urls --count 5        # print URLs only
erl-images "boiler service" --count 2 --json            # machine-readable output
```

Run `erl-images --help` for all flags.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `count` | 1 | validated images to save |
| `outDir` / `--out` | `./images` | output directory |
| `aspect` | `landscape` | `landscape` / `portrait` / `square` / `any` |
| `size` | `large` | `large` / `medium` / `small` / `wallpaper` / `any` |
| `minWidth` / `--min-width` | 640 | reject narrower sources |
| `minHeight` / `--min-height` | 400 | reject shorter sources |
| `width` / `--width` | — | resize down to width, keep aspect |
| `quality` / `--quality` | 80 | webp/jpeg quality |
| `webp` / `--no-webp` | true | convert to webp |
| `namePrefix` / `--name` | slug of query | filename prefix |

## The blacklist

`src/blocklist.js` blocks stock agencies, editorial wire services, microstock,
vector/POD marketplaces, and named trade-service competitors whose photos carry
their own logo. It is matched as a substring against the full URL, so bare
domains also catch CDN subdomains.

> ⚠️ **Licensing caveat.** Bing results are not licensed. The blacklist removes
> the highest-risk sources, but for a commercial site you should still treat
> fetched images as placeholders and confirm usage rights on anything customer-facing.

## License

MIT
