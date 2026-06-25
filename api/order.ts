import { getDb } from './_firebase';
import { verifyInitData } from './_auth';
import { setCors } from './_cors';
import { handleError } from './_errors';
import { rateLimit, clientIp } from './_ratelimit';

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: any, res: any) {
  setCors(req, res);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!rateLimit(`order:${clientIp(req)}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ORDERS_CHAT_ID = process.env.ORDERS_CHAT_ID;

  if (!BOT_TOKEN) return res.status(500).json({ error: 'BOT_TOKEN is not configured' });

  try {
    const data = req.body;

    // Verify initData to identify the confirmed user (for DM confirmation only).
    // Orders are allowed without auth; only confirmed user gets a DM.
    const initData = req.headers['x-telegram-init-data'] as string | undefined;
    const confirmedUser = verifyInitData(initData, BOT_TOKEN);

    const db = getDb();

    // ── Recalculate prices from Firestore — never trust client ────────────
    const clientItems: Array<{ id: string | number; quantity: number }> = data.items || [];
    const validItems: Array<{ id: number; name: string; price: number; quantity: number }> = [];

    for (const ci of clientItems) {
      const doc = await db.collection('products').doc(String(ci.id)).get();
      if (!doc.exists) continue;
      const p = doc.data()!;
      const qty = Math.max(1, Math.min(99, Math.round(Number(ci.quantity) || 1)));
      validItems.push({ id: p.id, name: p.name, price: p.price, quantity: qty });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ error: 'No valid items' });
    }

    const total = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const address = data.address || {};
    const phone   = escapeHtml(String(data.phone || 'не указан').slice(0, 30));
    const payment = data.payment === 'card' ? 'card' : 'cash';
    const comment = String(data.comment || '').slice(0, 500);

    // Short order ID (last 5 digits of timestamp)
    const orderId = String(Date.now()).slice(-5);

    // User display info — from verified initData only, NOT from req.body
    const firstName = escapeHtml(confirmedUser?.first_name || '');
    const lastName  = escapeHtml(confirmedUser?.last_name  || '');
    const fullName  = `${firstName} ${lastName}`.trim() || 'Гость';
    const username  = confirmedUser?.username ? `@${escapeHtml(confirmedUser.username)}` : '—';

    // ── Yandex Maps link ──────────────────────────────────────────────────
    const lat = Number(address.lat) || null;
    const lon = Number(address.lng) || null;
    const addressText = [
      escapeHtml(address.street),
      address.apartment ? `кв/офис ${escapeHtml(address.apartment)}` : '',
      address.floor     ? `эт. ${escapeHtml(address.floor)}`         : '',
      address.entrance  ? `подъезд ${escapeHtml(address.entrance)}`  : '',
      address.intercom  ? `домофон ${escapeHtml(address.intercom)}`  : '',
    ].filter(Boolean).join(', ');

    const mapsLink = lat && lon
      ? `https://yandex.uz/maps/?ll=${lon},${lat}&z=17&pt=${lon},${lat},pm2rdm`
      : `https://yandex.uz/maps/?text=${encodeURIComponent(address.street || '')}`;

    const navLink = lat && lon
      ? `https://yandex.uz/maps/?rtext=~${lat},${lon}&rtt=auto`
      : mapsLink;

    // ── Format items ──────────────────────────────────────────────────────
    const itemLines = validItems.map((item) => {
      const lineTotal = (item.price * item.quantity).toLocaleString('ru-RU');
      return `▪️ ${escapeHtml(item.name)}\n   ${item.quantity} шт × ${item.price.toLocaleString('ru-RU')} = <b>${lineTotal} сум</b>`;
    }).join('\n\n');

    // ── Build message ─────────────────────────────────────────────────────
    const lines: string[] = [];

    lines.push(`🧾 <b>Новый заказ #${orderId}</b>`);
    lines.push('');
    lines.push(`👤 <b>${fullName}</b>  (${username})`);
    lines.push(`📞 ${phone}`);
    lines.push(`💳 ${payment === 'cash' ? '💵 Наличными' : '💳 Картой'}`);
    if (comment) lines.push(`💬 <i>${escapeHtml(comment)}</i>`);

    lines.push('');
    lines.push('─────────────────');
    lines.push('<b>🛍 Состав заказа:</b>');
    lines.push('');
    lines.push(itemLines);
    lines.push('');
    lines.push(`💰 <b>Итого: ${total.toLocaleString('ru-RU')} сум</b>`);

    lines.push('');
    lines.push('─────────────────');
    lines.push('<b>📍 Адрес доставки:</b>');
    lines.push(`<code>${addressText || '—'}</code>`);
    lines.push('');
    lines.push(`🗺 <a href="${mapsLink}">Открыть на Яндекс.Картах</a>`);
    lines.push(`🚗 <a href="${navLink}">Маршрут в Яндекс.Навигаторе</a>`);

    const orderText = lines.join('\n');

    const sendTg = async (chatId: string | number, text: string) => {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      if (!r.ok) throw new Error(`Telegram API: ${await r.text()}`);
    };

    // Send to admin/group
    if (ORDERS_CHAT_ID) await sendTg(ORDERS_CHAT_ID, orderText);

    // DM confirmation only to cryptographically verified user
    if (confirmedUser?.id) {
      try {
        await sendTg(confirmedUser.id, '✅ <b>Ваш заказ принят!</b>\nМы свяжемся с вами в ближайшее время.');
      } catch (e) {
        console.error('Could not message user:', e);
      }
    }

    // Save to Supabase if configured
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: confirmedUser?.id || null,
            username: confirmedUser?.username || '',
            first_name: confirmedUser?.first_name || '',
            items: validItems,
            total,
            address,
            status: 'new',
          }),
        });
      } catch (e) {
        console.error('Supabase save error:', e);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
}
