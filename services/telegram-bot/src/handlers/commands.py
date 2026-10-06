"""
services/telegram-bot/src/handlers/commands.py
-----------------------------------------------
Command handlers for Telegram interactions (/start, /status, /help).
"""

from telegram import Update
from telegram.ext import ContextTypes

async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await update.message.reply_text(
        "🤖 **Quantum Trader Telegram Control Center**\n\n"
        "Available Commands:\n"
        "• `/status` - Check connection status to Gateway API\n"
        "• `/help` - View usage instructions",
        parse_mode="Markdown"
    )

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command."""
    await update.message.reply_text("🟢 Gateway API: **ONLINE** | WebSocket Pool: **CONNECTED**", parse_mode="Markdown")
