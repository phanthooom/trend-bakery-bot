export default async function handler(req: any, res: any) {
  // Настройка CORS (на всякий случай, хотя запрос идет с того же домена)
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const BOT_TOKEN = process.env.BOT_TOKEN
  const ORDERS_CHAT_ID = process.env.ORDERS_CHAT_ID

  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is missing')
    return res.status(500).json({ error: 'BOT_TOKEN is not configured in Vercel' })
  }

  try {
    const data = req.body
    
    const items = data.items || []
    const total = data.total || 0
    const address = data.address || {}
    const phone = data.phone || 'не указан'
    const payment = data.payment || 'не указан'
    const comment = data.comment || ''
    const user = data.user || {}

    const lines = ['🛒 <b>Новый заказ (Сайт)</b>']
    
    const username = user.username ? `@${user.username}` : 'нет'
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Неизвестный'
    lines.push(`👤 ${fullName} (${username})`)
        
    lines.push(`📞 Телефон: ${phone}`)
    lines.push(`💳 Оплата: ${payment === 'cash' ? 'Наличными' : 'Картой'}`)
    
    if (comment) {
      lines.push(`💬 Комментарий: <i>${comment}</i>`)
    }
        
    lines.push(`\n📍 Адрес: ${address.street || 'не указан'}`)
    if (address.apartment) {
      lines.push(`   Кв. ${address.apartment}, эт. ${address.floor || '?'}, подъезд ${address.entrance || '?'}`)
    }
    lines.push('')
    
    for (const item of items) {
      lines.push(`• ${item.name} × ${item.quantity} — ${(item.price * item.quantity).toLocaleString('ru-RU')} сум`)
    }
    lines.push(`\n💰 Итого: <b>${total.toLocaleString('ru-RU')} сум</b>`)

    const orderText = lines.join('\n')

    // Сохранение заказа в базу данных Supabase (если настроены ключи)
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabaseUrl = `${SUPABASE_URL}/rest/v1/orders`
        const dbData = {
          user_id: user.id || null,
          username: user.username || "",
          first_name: user.first_name || "",
          items: items,
          total: total,
          address: address,
          status: "new"
        }
        await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(dbData)
        })
      } catch (err) {
        console.error("Ошибка при сохранении в Supabase:", err)
      }
    }

    // Функция отправки сообщения в Телеграм
    const sendTelegramMessage = async (chatId: string | number, text: string) => {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Telegram API Error: ${await response.text()}`)
      }
    }

    // Отправляем админу/в группу
    if (ORDERS_CHAT_ID) {
      await sendTelegramMessage(ORDERS_CHAT_ID, orderText)
    }

    // Отправляем подтверждение юзеру, если есть его id
    if (user.id) {
      try {
        await sendTelegramMessage(user.id, "✅ Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.")
        await sendTelegramMessage(user.id, orderText)
      } catch (e) {
        console.error("Не удалось отправить сообщение клиенту", e)
      }
    }

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error processing order:', error)
    res.status(500).json({ error: error.message })
  }
}
