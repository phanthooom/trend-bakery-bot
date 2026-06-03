import { Pool } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(rows);
    }

    // Verify admin password for writing operations
    const authHeader = req.headers.authorization;
    if (!ADMIN_PASSWORD || authHeader !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { name, description, price, image, category } = req.body;
      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const { rows } = await pool.query(
        'INSERT INTO products (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, price, image, category]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, description, price, image, category } = req.body;
      if (!id || !name || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { rows } = await pool.query(
        'UPDATE products SET name = $1, description = $2, price = $3, image = $4, category = $5 WHERE id = $6 RETURNING *',
        [name, description, price, image, category, id]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Missing product id' });
      }

      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    // Vercel serverless functions recommend not closing the pool to reuse connections,
    // but typically pool end is fine. Let's just avoid closing to reuse it across warm invocations.
    // pool.end();
  }
}
