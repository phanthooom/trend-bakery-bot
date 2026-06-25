from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
ORDERS_CHAT_ID = os.environ.get("ORDERS_CHAT_ID", "")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "")


def tg_request(method: str, payload: dict) -> None:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except urllib.error.URLError as e:
        print(f"Telegram API error [{method}]: {e}")


def save_order(order: dict, user: dict) -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    url = f"{SUPABASE_URL}/rest/v1/orders"
    data = json.dumps({
        "user_id": user.get("id"),
        "username": user.get("username", ""),
        "first_name": user.get("first_name", ""),
        "items": order.get("items", []),
        "total": order.get("total", 0),
        "address": order.get("address", {}),
        "status": "new",
    }).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "return=minimal",
        },
    )
    req.get_method = lambda: "POST"
    try:
        urllib.request.urlopen(req, timeout=5)
    except urllib.error.URLError as e:
        print(f"Supabase error: {e}")


def handle_start(chat_id: int) -> None:
    tg_request("sendMessage", {
        "chat_id": chat_id,
        "text": "Добро пожаловать в <b>Trend Bakery</b>! 🍞\n\nСвежая выпечка с доставкой по Ташкенту.\nНажмите кнопку, чтобы открыть каталог:",
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [[
                {"text": "🥐 Открыть магазин", "web_app": {"url": WEBAPP_URL}}
            ]]
        },
    })


def handle_admin(chat_id: int) -> None:
    admin_url = WEBAPP_URL.rstrip("/") + "/admin"
    tg_request("sendMessage", {
        "chat_id": chat_id,
        "text": "🔐 <b>Панель администратора</b>",
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [[
                {"text": "⚙️ Открыть админку", "web_app": {"url": admin_url}}
            ]]
        },
    })


def handle_order(order: dict, user: dict, chat_id: int) -> None:
    import time, urllib.parse
    items   = order.get("items", [])
    total   = order.get("total", 0)
    address = order.get("address", {})
    phone   = order.get("phone", "не указан")
    payment = order.get("payment", "cash")
    comment = order.get("comment", "")

    save_order(order, user)

    tg_request("sendMessage", {
        "chat_id": chat_id,
        "text": "✅ <b>Ваш заказ принят!</b>\nМы свяжемся с вами в ближайшее время.",
        "parse_mode": "HTML",
    })

    if ORDERS_CHAT_ID:
        order_id = str(int(time.time()))[-5:]
        first = user.get("first_name", "")
        last  = user.get("last_name", "")
        full  = f"{first} {last}".strip() or "Гость"
        uname = f"@{user['username']}" if user.get("username") else "—"

        lat = address.get("lat")
        lon = address.get("lng")
        addr_parts = [
            address.get("street", ""),
            f"кв/офис {address['apartment']}" if address.get("apartment") else "",
            f"эт. {address['floor']}" if address.get("floor") else "",
            f"подъезд {address['entrance']}" if address.get("entrance") else "",
            f"домофон {address['intercom']}" if address.get("intercom") else "",
        ]
        addr_text = ", ".join(p for p in addr_parts if p)

        if lat and lon:
            maps_link = f"https://yandex.uz/maps/?ll={lon},{lat}&z=17&pt={lon},{lat},pm2rdm"
            nav_link  = f"https://yandex.uz/maps/?rtext=~{lat},{lon}&rtt=auto"
        else:
            q = urllib.parse.quote(address.get("street", ""))
            maps_link = f"https://yandex.uz/maps/?text={q}"
            nav_link  = maps_link

        item_lines = []
        for item in items:
            price = item.get("price", 0) * item.get("quantity", 1)
            item_lines.append(f"▪️ {item['name']}\n   {item['quantity']} шт × {item.get('price',0):,} = <b>{price:,} сум</b>")

        lines = [
            f"🧾 <b>Новый заказ #{order_id}</b>",
            "",
            f"👤 <b>{full}</b>  ({uname})",
            f"📞 {phone}",
            f"💳 {'💵 Наличными' if payment == 'cash' else '💳 Картой'}",
        ]
        if comment:
            lines.append(f"💬 <i>{comment}</i>")
        lines += [
            "",
            "─────────────────",
            "<b>🛍 Состав заказа:</b>",
            "",
            "\n\n".join(item_lines),
            "",
            f"💰 <b>Итого: {total:,} сум</b>",
            "",
            "─────────────────",
            "<b>📍 Адрес доставки:</b>",
            f"<code>{addr_text or '—'}</code>",
            "",
            f'🗺 <a href="{maps_link}">Открыть на Яндекс.Картах</a>',
            f'🚗 <a href="{nav_link}">Маршрут в Яндекс.Навигаторе</a>',
        ]

        tg_request("sendMessage", {
            "chat_id": int(ORDERS_CHAT_ID),
            "text": "\n".join(lines),
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        })


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            update = json.loads(body)
        except Exception:
            self._respond(400, b"Bad Request")
            return

        message = update.get("message", {})
        if message:
            chat_id = message["chat"]["id"]
            user = message.get("from", {})
            text = message.get("text", "")

            if text.startswith("/start"):
                handle_start(chat_id)
            elif text.startswith("/admin"):
                handle_admin(chat_id)

            web_app_data = message.get("web_app_data")
            if web_app_data:
                try:
                    order = json.loads(web_app_data.get("data", "{}"))
                    if order.get("type") == "order":
                        handle_order(order, user, chat_id)
                except Exception as e:
                    print(f"Order parse error: {e}")

        self._respond(200, b"OK")

    def _respond(self, code: int, body: bytes) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
