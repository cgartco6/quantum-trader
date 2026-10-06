"""
services/telegram-bot/src/notifications/broadcaster.py
-------------------------------------------------------
Notification dispatch unit for forwarding live signal broadcasts to Telegram channels.
"""

from telegram.ext import Application
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

async def broadcast_signal_to_chat(app: Application, chat_id: str, signal: dict):
    text = (
        f"⚡ **QUANTUM SIGNAL ALERT** ⚡\n\n"
        f"Asset: `{signal['symbol']}`\n"
        f"Action: `{signal['direction']}`\n"
        f"Target Entry: `${signal['entry']}`\n"
        f"Stop Loss: `${signal['stopLoss']}`\n"
        f"Take Profit: `${signal['takeProfit']}`"
    )

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Execute", callback_data=f"APPROVED:{signal['id']}"),
            InlineKeyboardButton("❌ Dismiss", callback_data=f"REJECTED:{signal['id']}")
        ]
    ])

    await app.bot.send_message(chat_id=chat_id, text=text, reply_markup=keyboard, parse_mode="Markdown")
