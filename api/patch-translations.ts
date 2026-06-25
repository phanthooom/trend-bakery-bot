import { getDb } from './_firebase';
import { requireAdmin } from './_auth';

// Russian name → UZ + EN translations
const TRANSLATIONS: Record<string, { name_uz: string; name_en: string; description_uz: string; description_en: string }> = {
  'Мини хлебное ассорти': {
    name_uz: 'Mini non assortisi',
    name_en: 'Mini bread assortment',
    description_uz: 'Non «Sutli» – 16 ta, Non «Qishloq» – 16 ta, Non «Kepakli» – 16 ta, Non «Sabzavotli» – 16 ta. Jami: 64 ta',
    description_en: '"Milk" bread – 16 pcs, "Village" bread – 16 pcs, "Bran" bread – 16 pcs, "Carrot" bread – 16 pcs. Total: 64 pcs',
  },
  'Набор «Белый»': {
    name_uz: 'To\'plam «Oq»',
    name_en: '"White" set',
    description_uz: 'Baton «Sutli 60g» – 11 ta, Baget «Piyozli 60g» – 11 ta, Baget «Artizan 60g» – 11 ta, Non «Sutli» – 10 ta, Non «Naqshli» – 10 ta, Chiabatta – 6 ta. Jami: 61 ta',
    description_en: '"Milk" loaf 60g – 11 pcs, "Onion" baguette 60g – 11 pcs, "Artisan" baguette 60g – 11 pcs, "Milk" bread – 10 pcs, "Shaped" bread – 10 pcs, Ciabatta – 6 pcs. Total: 61 pcs',
  },
  'Сет «Медиум»': {
    name_uz: 'Set «Medium»',
    name_en: '"Medium" set',
    description_uz: 'Non «Sutli» – 4 ta, Non «Kepakli» – 4 ta, Non «Qishloq» – 4 ta, Non «Sabzavot-piyozli» – 4 ta, Non «Naqshli» – 4 ta, Baget «Donli» – 4 ta, Baget «Piyozli» – 4 ta. Jami: 44 ta',
    description_en: '"Milk" bread – 4 pcs, "Bran" bread – 4 pcs, "Village" bread – 4 pcs, "Carrot-onion" bread – 4 pcs, "Shaped" bread – 4 pcs, "Grain" baguette – 4 pcs, "Onion" baguette – 4 pcs. Total: 44 pcs',
  },
  'Набор «Ассорти»': {
    name_uz: 'To\'plam «Assortiment»',
    name_en: '"Assorted" set',
    description_uz: 'Toster noni – 1 ta, Non «Borodino» – 1 ta, Baget «Qora donli» – 10 ta, Baget «Sutli» – 7 ta, Non «Donli» – 7 ta, Non «Qishloq» – 7 ta, Non «Naqshli» – 7 ta va boshq. Jami: 78 ta',
    description_en: 'Toast bread – 1 pc, "Borodino" bread – 1 pc, "Black grain" baguette – 10 pcs, "Milk" baguette – 7 pcs, "Grain" bread – 7 pcs, "Village" bread – 7 pcs, "Shaped" bread – 7 pcs, etc. Total: 78 pcs',
  },
  'Набор «Ржаной»': {
    name_uz: 'To\'plam «Javdarli»',
    name_en: '"Rye" set',
    description_uz: 'Non «Borodino» – 4 ta, Non «Qishloq» – 8 ta, Non «Kepakli» – 8 ta, Non «Qora donli kvadrat» – 8 ta, Baget «Qora donli» – 8 ta, Baget «Kepakli» – 8 ta. Jami: 52 ta',
    description_en: '"Borodino" bread – 4 pcs, "Village" bread – 8 pcs, "Bran" bread – 8 pcs, "Black grain square" bread – 8 pcs, "Black grain" baguette – 8 pcs, "Bran" baguette – 8 pcs. Total: 52 pcs',
  },
  '🔥 Новинка! Сет «Мини слоеное ассорти П/Ф»': {
    name_uz: '🔥 Yangilik! Set «Mini pufakli assortiment»',
    name_en: '🔥 New! Mini puff pastry assortment set',
    description_uz: '1. «Klassik kruassan sariyog\'da» - 9 ta.\n2. «Pain chocolate» - 9 ta.\n3. «Danish krem va mayizli» - 16 ta.\n\nUmumiy miqdor: 34 ta.',
    description_en: '1. "Classic butter croissant" - 9 pcs.\n2. "Pain au chocolat" - 9 pcs.\n3. "Danish with cream and raisins" - 16 pcs.\n\nTotal: 34 pcs.',
  },
  'Mini Хлебное ассорти': {
    name_uz: 'Mini non assortisi',
    name_en: 'Mini bread assortment',
    description_uz: 'Non "Sutli" - 16 ta, Non "Qishloq" - 16 ta, Non "Donli" - 16 ta, Non "Sabzavotli" - 16 ta',
    description_en: '"Milk" bread - 16 pcs, "Village" bread - 16 pcs, "Grain" bread - 16 pcs, "Carrot" bread - 16 pcs',
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const db = getDb();
    const snap = await db.collection('products').get();

    const batch = db.batch();
    let patched = 0;

    for (const doc of snap.docs) {
      const name: string = doc.data().name || '';
      const tr = TRANSLATIONS[name];
      if (tr) {
        batch.update(doc.ref, tr);
        patched++;
      }
    }

    await batch.commit();
    return res.status(200).json({ patched, total: snap.size });
  } catch (error: any) {
    console.error('Patch error:', error);
    res.status(500).json({ error: error.message });
  }
}
