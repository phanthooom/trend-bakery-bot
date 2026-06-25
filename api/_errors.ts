import { randomUUID } from 'crypto';

export function handleError(res: any, error: unknown): void {
  const ref = randomUUID();
  console.error(`[${ref}]`, error);
  res.status(500).json({ error: 'Internal server error', ref });
}
