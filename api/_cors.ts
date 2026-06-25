// Allowed origins from env: comma-separated list, e.g. "https://foo.vercel.app,https://bar.com"
// If unset: wildcard origin without credentials (custom-header auth still works; cookies blocked).
const ALLOWED_ORIGINS: Set<string> = new Set(
  (process.env.ALLOWED_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean)
);

const ALLOW_HEADERS =
  'Content-Type, Authorization, X-Telegram-Init-Data, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version';

export function setCors(req: any, res: any): void {
  const origin = req.headers.origin as string | undefined;

  if (ALLOWED_ORIGINS.size > 0) {
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    // No match → no CORS headers → browser blocks the cross-origin request.
  } else {
    // No allowlist: wildcard without credentials.
    // Custom-header auth (X-Telegram-Init-Data) still works; browser cookies are blocked.
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
}
