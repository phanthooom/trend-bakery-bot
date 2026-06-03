import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

from aiohttp import web

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-ngrok-url.ngrok.io")
ORDERS_CHAT_ID = os.getenv("ORDERS_CHAT_ID")
API_PORT = int(os.getenv("API_PORT", 8000))

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: types.Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(
                text="🥐 Открыть магазин",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )]
        ],
        resize_keyboard=True
    )
    await message.answer(
        "Добро пожаловать в <b>Trend Bakery</b>! 🍞\n\n"
        "Свежая выпечка с доставкой по Ташкенту.\n"
        "Нажмите кнопку, чтобы открыть каталог:",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

async def api_order_handler(request: web.Request):
    if request.method == "OPTIONS":
        return web.Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        })

    try:
        data = await request.json()
    except Exception:
        return web.Response(status=400, text="Invalid JSON", headers={"Access-Control-Allow-Origin": "*"})

    items = data.get("items", [])
    total = data.get("total", 0)
    address = data.get("address", {})
    phone = data.get("phone", "не указан")
    payment = data.get("payment", "не указан")
    comment = data.get("comment", "")
    user_info = data.get("user", {})

    lines = [f"🛒 <b>Новый заказ (через API)</b>"]
    
    user_id = user_info.get("id")
    if user_info:
        username = user_info.get("username", "нет")
        first_name = user_info.get("first_name", "")
        last_name = user_info.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        lines.append(f"👤 {full_name} (@{username})")
    else:
        lines.append(f"👤 Пользователь (неизвестен)")
        
    lines.append(f"📞 Телефон: {phone}")
    lines.append(f"💳 Оплата: {'Наличными' if payment == 'cash' else 'Картой'}")
    
    if comment:
        lines.append(f"💬 Комментарий: <i>{comment}</i>")
        
    lines.append(f"\n📍 Адрес: {address.get('street', 'не указан')}")
    if address.get("apartment"):
        lines.append(f"   Кв. {address['apartment']}, эт. {address.get('floor', '?')}, подъезд {address.get('entrance', '?')}")
    lines.append("")
    for item in items:
        lines.append(f"• {item['name']} × {item['quantity']} — {item['price'] * item['quantity']:,} сум")
    lines.append(f"\n💰 Итого: <b>{total:,} сум</b>")

    order_text = "\n".join(lines)

    if user_id:
        try:
            await bot.send_message(user_id, "✅ Заказ принят! Мы свяжемся с вами в ближайшее время.")
            await bot.send_message(user_id, order_text, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Failed to send to user: {e}")

    if ORDERS_CHAT_ID:
        try:
            await bot.send_message(ORDERS_CHAT_ID, order_text, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Failed to send to admin: {e}")

    return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

async def main():
    app = web.Application()
    app.router.add_options("/api/order", api_order_handler)
    app.router.add_post("/api/order", api_order_handler)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', API_PORT)
    await site.start()
    logging.info(f"API server running on port {API_PORT}")

    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
