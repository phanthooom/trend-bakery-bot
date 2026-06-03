import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-ngrok-url.ngrok.io")
ORDERS_CHAT_ID = os.getenv("ORDERS_CHAT_ID")

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


@dp.message(lambda m: m.web_app_data is not None)
async def handle_order(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
    except Exception:
        await message.answer("Ошибка при получении заказа.")
        return

    if data.get("type") != "order":
        return

    items = data.get("items", [])
    total = data.get("total", 0)
    address = data.get("address", {})
    phone = data.get("phone", "не указан")
    payment = data.get("payment", "не указан")
    comment = data.get("comment", "")

    user = message.from_user
    lines = [f"🛒 <b>Новый заказ</b>"]
    lines.append(f"👤 {user.full_name} (@{user.username or 'нет'})")
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

    await message.answer("✅ Заказ принят! Мы свяжемся с вами в ближайшее время.")

    if ORDERS_CHAT_ID:
        await bot.send_message(ORDERS_CHAT_ID, order_text, parse_mode="HTML")


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
