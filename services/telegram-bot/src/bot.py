import os
import asyncio
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN")

async def send_trade_signal(app: Application, chat_id: str, signal_data: dict):
    """
    Sends interactive trade decision card to Telegram chat.
    """
    message = (
        f"🚨 <b>HIGH CONFLUENCE TRADE SIGNAL</b> 🚨\n\n"
        f"<b>Asset:</b> {signal_data['symbol']}\n"
        f"<b>Direction:</b> {signal_data['direction']}\n"
        f"<b>Entry Price:</b> ${signal_data['entry_price']}\n"
        f"<b>Stop Loss:</b> ${signal_data['stop_loss']}\n"
        f"<b>Take Profit:</b> ${signal_data['take_profit']}\n"
        f"<b>Risk/Reward:</b> 1:{signal_data['risk_reward_ratio']}\n"
        f"<b>Confidence:</b> {signal_data['confidence_score'] * 100}%\n"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("✅ Approve & Execute", callback_data=f"EXEC_{signal_data['signal_id']}"),
            InlineKeyboardButton("❌ Reject", callback_data=f"REJ_{signal_data['signal_id']}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await app.bot.send_message(
        chat_id=chat_id,
        text=message,
        parse_mode="HTML",
        reply_markup=reply_markup
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    action, signal_id = query.data.split("_")
    
    if action == "EXEC":
        # Call API Gateway to execute broker order
        await query.edit_message_text(
            text=f"{query.message.text}\n\n<b>STATUS: APPROVED & EXECUTED</b>",
            parse_mode="HTML"
        )
    elif action == "REJ":
        await query.edit_message_text(
            text=f"{query.message.text}\n\n<b>STATUS: REJECTED BY USER</b>",
            parse_mode="HTML"
        )

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.run_polling()

if __name__ == "__main__":
    main()
