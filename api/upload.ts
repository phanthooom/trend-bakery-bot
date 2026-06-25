import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireAdmin } from './_auth';
import { setCors } from './_cors';
import { handleError } from './_errors';
import { rateLimit, clientIp } from './_ratelimit';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export default async function handler(req: any, res: any) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      if (!rateLimit(`upload:${clientIp(req)}`, 20, 60_000)) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      const contentType = (req.headers['content-type'] as string | undefined)
        ?.split(';')[0]
        .trim() ?? '';
      const ext = ALLOWED_MIME[contentType];
      if (!ext) {
        return res.status(415).json({ error: 'Unsupported media type. Allowed: jpeg, png, webp, gif' });
      }

      const contentLength = Number(req.headers['content-length'] ?? 0);
      if (contentLength > MAX_BYTES) {
        return res.status(413).json({ error: 'File too large. Max 5 MB' });
      }

      const safeFilename = `uploads/${randomUUID()}.${ext}`;
      const blob = await put(safeFilename, req, {
        access: 'public',
        contentType,
      });

      return res.status(200).json(blob);
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    handleError(res, error);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
