import crypto from 'crypto';
import { getDb } from './_firebase';

export interface TgUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface AdminCtx {
  user: TgUser;
  role: 'super' | 'admin';
}

// Verify Telegram WebApp initData via HMAC-SHA256 (official algorithm).
// Returns the authenticated user, or null if the signature is invalid/forged.
export function verifyInitData(initData: string | undefined, botToken: string | undefined): TgUser | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calcHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(calcHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // Reject stale initData (> 24h old) to limit replay window.
  const authDate = Number(params.get('auth_date'));
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as TgUser;
  } catch {
    return null;
  }
}

// Verify caller is an authenticated admin. The super-admin (ADMIN_TELEGRAM_ID)
// is auto-provisioned into the admins collection on first valid request.
export async function requireAdmin(req: any): Promise<AdminCtx | null> {
  const initData = (req.headers['x-telegram-init-data'] as string) || (req.headers['authorization'] as string);
  const user = verifyInitData(initData, process.env.BOT_TOKEN);
  if (!user) return null;

  const db = getDb();
  const ref = db.collection('admins').doc(String(user.id));
  const doc = await ref.get();

  if (doc.exists) {
    return { user, role: (doc.data()?.role as 'super' | 'admin') || 'admin' };
  }

  // Bootstrap the super-admin from env on first login.
  if (process.env.ADMIN_TELEGRAM_ID && String(user.id) === String(process.env.ADMIN_TELEGRAM_ID)) {
    await ref.set(
      {
        telegram_id: user.id,
        name: user.first_name || 'Super Admin',
        username: user.username || '',
        role: 'super',
        added_by: 'system',
        created_at: Date.now(),
      },
      { merge: true }
    );
    return { user, role: 'super' };
  }

  return null;
}
