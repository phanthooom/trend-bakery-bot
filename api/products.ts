import { randomInt } from 'crypto';
import { getDb } from './_firebase';
import { requireAdmin } from './_auth';
import { setCors } from './_cors';
import { handleError } from './_errors';
import { sanitizeProductFields } from './_sanitize';
import { rateLimit, clientIp } from './_ratelimit';

export default async function handler(req: any, res: any) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = getDb();

  try {
    if (req.method === 'GET') {
      if (!rateLimit(`products:get:${clientIp(req)}`, 60, 60_000)) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      const snap = await db.collection('products').orderBy('created_at', 'desc').get();
      const products = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          name: data.name,
          description: data.description || '',
          price: data.price,
          image: data.image,
          category: data.category,
        };
      });
      return res.status(200).json(products);
    }

    const admin = await requireAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const fields = sanitizeProductFields(req.body);
      if (!fields.name || Number.isNaN(fields.price) || !fields.category) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
      }

      const id = randomInt(1_000_000, 2 ** 48);
      const now = Date.now();
      const product = {
        id,
        name: fields.name,
        description: fields.description,
        price: fields.price,
        image: fields.image,
        category: fields.category,
        created_at: now,
      };
      await db.collection('products').doc(String(id)).set(product);
      return res.status(201).json(product);
    }

    if (req.method === 'PUT') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing product id' });
      }

      const fields = sanitizeProductFields(req.body);
      if (!fields.name || Number.isNaN(fields.price) || !fields.category) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
      }

      const ref = db.collection('products').doc(String(id));
      const update = {
        name: fields.name,
        description: fields.description,
        price: fields.price,
        image: fields.image,
        category: fields.category,
      };
      await ref.set(update, { merge: true });
      const doc = await ref.get();
      return res.status(200).json({ id, ...doc.data() });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Missing product id' });
      }

      await db.collection('audit_log').add({
        action: 'delete_product',
        product_id: String(id),
        by: admin.user.id,
        at: Date.now(),
      });
      await db.collection('products').doc(String(id)).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    handleError(res, error);
  }
}
