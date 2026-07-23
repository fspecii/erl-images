export type Aspect = "landscape" | "portrait" | "square" | "any";
export type ImageSize = "large" | "medium" | "small" | "wallpaper" | "any";

export interface SearchOptions {
  /** Number of candidate URLs to aim for (default 8). */
  count?: number;
  aspect?: Aspect;
  size?: ImageSize;
}

export interface FetchOptions {
  /** How many validated images to save (default 1). */
  count?: number;
  /** Output directory, created if missing (default "./images"). */
  outDir?: string;
  aspect?: Aspect;
  size?: ImageSize;
  /** Reject source images narrower than this (default 640). */
  minWidth?: number;
  /** Reject source images shorter than this (default 400). */
  minHeight?: number;
  /** Convert output to webp (default true). */
  webp?: boolean;
  /** webp/jpeg quality 1-100 (default 80). */
  quality?: number;
  /** Resize down to this width, preserving aspect. Null = keep original. */
  width?: number | null;
  /** Filename prefix. Defaults to a slug of the query. */
  namePrefix?: string | null;
  /** Candidate downloads attempted per requested image (default 6). */
  candidatesPerResult?: number;
  /** Per-download timeout in ms (default 15000). */
  timeoutMs?: number;
  /** Optional progress callback. */
  onLog?: ((message: string) => void) | null;
}

export interface FetchedImage {
  /** Absolute or relative path to the saved file. */
  path: string;
  filename: string;
  /** Original source URL the image was downloaded from. */
  url: string;
  query: string;
  width: number;
  height: number;
  bytes: number;
}

/** Scrape Bing Images and return direct, non-blocked image URLs. */
export function searchImages(query: string, options?: SearchOptions): Promise<string[]>;

/** Search, download, validate, convert to webp, and write files to disk. */
export function fetchImages(query: string, options?: FetchOptions): Promise<FetchedImage[]>;

/** True if a URL matches a blocked domain or watermark pattern. */
export function isBlocked(url: string): boolean;
