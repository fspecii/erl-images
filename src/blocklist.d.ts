/** Bare domains + slugs matched as substrings against the full URL. */
export const BLOCKED_DOMAINS: string[];
/** Watermark / stock path substrings matched against the full URL. */
export const WATERMARK_PATTERNS: string[];
/** Genuinely-free CC0 hosts that always pass, overriding every block rule. */
export const ALLOW_HOSTS: string[];
/** True if a URL matches a blocked domain or watermark pattern (and is not allow-listed). */
export function isBlocked(url: string): boolean;
