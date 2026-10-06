"""
services/telegram-bot/src/bot.py
---------------------------------
Telegram Notification and Control Bot.
Listens for live signal broadcasts and allows interactive trade approvals via Inline Keyboard.
"""

import os
import asyncio
import logging
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "MOCK_TELEGRAM_BOT_TOKEN")
GATEWAY_API_URL = os.getenv("GATEWAY_API_URL", "http://api-gateway:8000/api/v1")


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler for /start command."""
    await update.message.reply_text(
        "⚡ **Quantum Trader Signal Bot Active** ⚡\n\n"
        "You will receive real-time execution alerts here."
    )


async def send_signal_alert(bot_app: Application, chat_id: str, signal_data: dict):
    """Format and send trade signal with interactive approval buttons."""
    message_text = (
        f"🚨 **NEW LIVE SIGNAL DETECTED** 🚨\n\n"
        f"• **Symbol:** `{signal_data['symbol']}`\n"
        f"• **Direction:** `{signal_data['direction']}`\n"
        f"• **Entry:** `${signal_data['entry']:.2f}`\n"
        f"• **Stop Loss:** `${signal_data['stopLoss']:.2f}`\n"
        f"• **Take Profit:** `${signal_data['takeProfit']:.2f}`\n"
        f"• **Confidence:** `{signal_data['confidence'] * 100:.0f}%`"
    )

    keyboard = [
        [
            InlineKeyboardButton("✅ Approve & Execute", callback_data=f"APPROVED:{signal_data['id']}"),
            InlineKeyboardButton("❌ Reject", callback_data=f"REJECTED:{signal_data['id']}"),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await bot_app.bot.send_message(
        chat_id=chat_id, text=message_text, reply_markup=reply_markup, parse_mode="Markdown"
    )


async def button_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle callback queries when user presses Approve or Reject in Telegram."""
    query = update.callback_query
    await query.answer()

    action, signal_id = query.data.split(":")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{GATEWAY_API_URL}/execute",
                json={"signal_id": signal_id, "decision": action},
            )
            if res.status_code == 200:
                status_emoji = "✅" if action == "APPROVED" else "❌"
                await query.edit_message_text(
                    text=f"{query.message.text}\n\n{status_emoji} **DECISION DISPATCHED:** `{action}`"
                )
            else:
                await query.edit_message_text(text=f"⚠️ Failed to process decision: {res.text}")
        except Exception as e:
            logger.error(f"Error dispatching trade decision: {e}")
            await query.edit_message_text(text="❌ Connection error to Gateway API.")


def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CallbackQueryHandler(button_callback_handler))

    logger.info("Telegram Signal Bot running...")
    app.run_polling()


if __name__ == "__main__":
    main()
