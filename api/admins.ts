import { getDb } from './_firebase';
import { requireAdmin } from './_auth';

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Telegram-Init-Data'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getDb();

    if (req.method === 'GET') {
      // Any admin can see the list (and learn their own role on the client).
      const snap = await db.collection('admins').orderBy('created_at', 'asc').get();
      const admins = snap.docs.map((d) => d.data());
      return res.status(200).json({ admins, me: admin });
    }

    // Mutations are super-admin only.
    if (admin.role !== 'super') {
      return res.status(403).json({ error: 'Forbidden: super-admin only' });
    }

    if (req.method === 'POST') {
      const { telegram_id, name } = req.body;
      const tid = Number(telegram_id);
      if (!tid || Number.isNaN(tid)) {
        return res.status(400).json({ error: 'Invalid telegram_id' });
      }

      const ref = db.collection('admins').doc(String(tid));
      if ((await ref.get()).exists) {
        return res.status(409).json({ error: 'Admin already exists' });
      }

      const newAdmin = {
        telegram_id: tid,
        name: name || '',
        username: '',
        role: 'admin',
        added_by: admin.user.id,
        created_at: Date.now(),
      };
      await ref.set(newAdmin);
      return res.status(201).json(newAdmin);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const tid = String(id);
      if (!tid) {
        return res.status(400).json({ error: 'Missing id' });
      }
      // Guard: can't remove yourself or a super-admin.
      if (tid === String(admin.user.id)) {
        return res.status(400).json({ error: 'Cannot remove yourself' });
      }
      const doc = await db.collection('admins').doc(tid).get();
      if (doc.exists && doc.data()?.role === 'super') {
        return res.status(400).json({ error: 'Cannot remove a super-admin' });
      }
      await db.collection('admins').doc(tid).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
