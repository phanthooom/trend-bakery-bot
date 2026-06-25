import { getDb } from './_firebase';
import { requireAdmin } from './_auth';

// Initial catalog (mirrors frontend/src/data/products.ts). Used once to populate
// an empty Firestore. Safe to call repeatedly — it no-ops if products exist.
const SEED_PRODUCTS = [
  { name: 'Мини хлебное ассорти', description: 'Хлеб «Молочный» – 16 шт, Хлеб «Деревенский» – 16 шт, Хлеб «Отрубной» – 16 шт, Хлеб «Морковный» – 16 шт. Итого: 64 шт', price: 230000, image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80', category: 'home' },
  { name: 'Набор «Белый»', description: 'Батон «Молочный 60г» – 11 шт, Багет «С луком 60г» – 11 шт, Багет «Артизан 60г» – 11 шт, Хлеб «Молочный» – 10 шт, Хлеб «Фигурный» – 10 шт, Чиабатта – 6 шт. Итого: 61 шт', price: 230000, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', category: 'home' },
  { name: 'Сет «Медиум»', description: 'Хлеб «Молочный» – 4 шт, Хлеб «Отрубной» – 4 шт, Хлеб «Деревенский» – 4 шт, Хлеб «Морковно-луковый» – 4 шт, Хлеб «Фигурный» – 4 шт, Багет «Зерновой» – 4 шт, Багет «С луком» – 4 шт. Итого: 44 шт', price: 185000, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=800&q=80', category: 'home' },
  { name: 'Набор «Ассорти»', description: 'Тостерный хлеб – 1 шт, Хлеб «Бородинский» – 1 шт, Багет «Зерновой чёрный» – 10 шт, Багет «Молочный» – 7 шт, Хлеб «Зерновой» – 7 шт, Хлеб «Деревенский» – 7 шт, Хлеб «Фигурный» – 7 шт и др. Итого: 78 шт', price: 255000, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=800&q=80', category: 'home' },
  { name: 'Набор «Ржаной»', description: 'Хлеб «Бородинский» – 4 шт, Хлеб «Деревенский» – 8 шт, Хлеб «Отрубной» – 8 шт, Хлеб «Квадрат чёрный зерновой» – 8 шт, Багет «Чёрный зерновой» – 8 шт, Багет «Отрубной» – 8 шт. Итого: 52 шт', price: 230000, image: 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&q=80', category: 'home' },
  { name: '🔥 Новинка! Сет «Мини слоеное ассорти П/Ф»', description: '1. «Классический круассан на сливочном масле» - 9 шт.\n2. «Pain chocolate» - 9 шт.\n3. «Даниш с кремом и изюмом» - 16 шт.\n\nОбщее количество: 34 шт.', price: 300000, image: '/mini-sloenoe.png', category: 'home' },
  { name: 'Mini Хлебное ассорти', description: 'Хлеб "Молочный" - 16 шт, Хлеб "Деревенский" - 16 шт, Хлеб "Злаковый" - 16 шт, Хлеб "Морковный" - 16 шт', price: 230000, image: '/mini-assorti.png', category: 'retail' },
];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getDb();
    const existing = await db.collection('products').limit(1).get();
    if (!existing.empty) {
      return res.status(200).json({ seeded: 0, message: 'Products already exist, skipped.' });
    }

    const batch = db.batch();
    let id = Date.now();
    for (const p of SEED_PRODUCTS) {
      id += 1; // unique, ascending ids
      const ref = db.collection('products').doc(String(id));
      batch.set(ref, { id, ...p, created_at: id });
    }
    await batch.commit();

    return res.status(201).json({ seeded: SEED_PRODUCTS.length });
  } catch (error: any) {
    console.error('Seed Error:', error);
    res.status(500).json({ error: error.message });
  }
}
