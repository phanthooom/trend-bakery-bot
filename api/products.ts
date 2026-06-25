import { getDb } from './_firebase';
import { requireAdmin } from './_auth';

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Telegram-Init-Data'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = getDb();

  try {
    if (req.method === 'GET') {
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

    // Writes require a verified Telegram admin.
    const admin = await requireAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { name, description, price, image, category } = req.body;
      if (!name || price == null || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const id = Date.now();
      const product = {
        id,
        name,
        description: description || '',
        price: Number(price),
        image: image || '',
        category,
        created_at: id,
      };
      await db.collection('products').doc(String(id)).set(product);
      return res.status(201).json(product);
    }

    if (req.method === 'PUT') {
      const { id, name, description, price, image, category } = req.body;
      if (!id || !name || price == null || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const ref = db.collection('products').doc(String(id));
      const update = {
        name,
        description: description || '',
        price: Number(price),
        image: image || '',
        category,
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
      await db.collection('products').doc(String(id)).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
