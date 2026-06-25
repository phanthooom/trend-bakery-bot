export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const BOT_TOKEN = process.env.BOT_TOKEN
  const ORDERS_CHAT_ID = process.env.ORDERS_CHAT_ID

  if (!BOT_TOKEN) return res.status(500).json({ error: 'BOT_TOKEN is not configured' })

  try {
    const data = req.body
    const items   = data.items   || []
    const total   = data.total   || 0
    const address = data.address || {}
    const phone   = data.phone   || 'не указан'
    const payment = data.payment || 'cash'
    const comment = data.comment || ''
    const user    = data.user    || {}

    // Short order ID (last 5 digits of timestamp)
    const orderId = String(Date.now()).slice(-5)

    const firstName = user.first_name || ''
    const lastName  = user.last_name  || ''
    const fullName  = `${firstName} ${lastName}`.trim() || 'Гость'
    const username  = user.username ? `@${user.username}` : '—'

    // ── Yandex Maps link ──────────────────────────────────────────────────
    const lat = address.lat
    const lon = address.lng
    const addressText = [
      address.street,
      address.apartment ? `кв/офис ${address.apartment}` : '',
      address.floor     ? `эт. ${address.floor}` : '',
      address.entrance  ? `подъезд ${address.entrance}` : '',
      address.intercom  ? `домофон ${address.intercom}` : '',
    ].filter(Boolean).join(', ')

    const mapsLink = lat && lon
      ? `https://yandex.uz/maps/?ll=${lon},${lat}&z=17&pt=${lon},${lat},pm2rdm`
      : `https://yandex.uz/maps/?text=${encodeURIComponent(address.street || '')}`

    const navLink = lat && lon
      ? `https://yandex.uz/maps/?rtext=~${lat},${lon}&rtt=auto`
      : mapsLink

    // ── Format items ──────────────────────────────────────────────────────
    const itemLines = items.map((item: any) => {
      const lineTotal = (item.price * item.quantity).toLocaleString('ru-RU')
      return `▪️ ${item.name}\n   ${item.quantity} шт × ${item.price.toLocaleString('ru-RU')} = <b>${lineTotal} сум</b>`
    }).join('\n\n')

    // ── Build message ─────────────────────────────────────────────────────
    const lines: string[] = []

    lines.push(`🧾 <b>Новый заказ #${orderId}</b>`)
    lines.push('')
    lines.push(`👤 <b>${fullName}</b>  (${username})`)
    lines.push(`📞 ${phone}`)
    lines.push(`💳 ${payment === 'cash' ? '💵 Наличными' : '💳 Картой'}`)
    if (comment) lines.push(`💬 <i>${comment}</i>`)

    lines.push('')
    lines.push('─────────────────')
    lines.push('<b>🛍 Состав заказа:</b>')
    lines.push('')
    lines.push(itemLines)
    lines.push('')
    lines.push(`💰 <b>Итого: ${total.toLocaleString('ru-RU')} сум</b>`)

    lines.push('')
    lines.push('─────────────────')
    lines.push('<b>📍 Адрес доставки:</b>')
    lines.push(`<code>${addressText || '—'}</code>`)
    lines.push('')
    lines.push(`🗺 <a href="${mapsLink}">Открыть на Яндекс.Картах</a>`)
    lines.push(`🚗 <a href="${navLink}">Маршрут в Яндекс.Навигаторе</a>`)

    const orderText = lines.join('\n')

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
      })
      if (!r.ok) throw new Error(`Telegram API: ${await r.text()}`)
    }

    // Send to admin/group
    if (ORDERS_CHAT_ID) await sendTg(ORDERS_CHAT_ID, orderText)

    // Send confirmation to user
    if (user.id) {
      try {
        await sendTg(user.id, '✅ <b>Ваш заказ принят!</b>\nМы свяжемся с вами в ближайшее время.')
      } catch (e) {
        console.error('Could not message user:', e)
      }
    }

    // Save to Supabase if configured
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
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
            user_id: user.id || null,
            username: user.username || '',
            first_name: user.first_name || '',
            items,
            total,
            address,
            status: 'new',
          }),
        })
      } catch (e) {
        console.error('Supabase save error:', e)
      }
    }

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Order error:', error)
    res.status(500).json({ error: error.message })
  }
}
