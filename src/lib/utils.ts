export function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const PRIVATE_HOST_RE =
  /^(localhost|::1)$|^127\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\.|^169\.254\./;

export function isSafeUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const host = parsed.hostname;
  if (!host) return false;
  if (PRIVATE_HOST_RE.test(host)) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  return true;
}
