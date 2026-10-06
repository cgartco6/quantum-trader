FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY services/telegram-bot/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/telegram-bot/src ./src

CMD ["python", "src/bot.py"]
