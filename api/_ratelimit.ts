// In-memory per-instance rate limiter.
// Provides burst protection within a single warm serverless instance.
// For multi-instance enforcement, replace with Vercel KV (@vercel/kv).

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Purge expired buckets every 5 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Returns true if the request is within the allowed rate.
 * @param key     Unique identifier (e.g. `"products:get:<ip>"`)
 * @param limit   Max requests per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? 'unknown'
  );
}
