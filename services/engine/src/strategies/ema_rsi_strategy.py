import pandas as pd
from typing import Optional
from services.engine.src.models.signal import TradeSignal, SignalDirection
from services.engine.src.indicators.technical import calculate_ema, calculate_rsi

class EmaRsiStrategy:
    def __init__(self, ema_fast: int = 9, ema_slow: int = 21, rsi_period: int = 14):
        self.ema_fast = ema_fast
        self.ema_slow = ema_slow
        self.rsi_period = rsi_period

    def generate_signal(self, df: pd.DataFrame, symbol: str) -> Optional[TradeSignal]:
        if len(df) < self.ema_slow:
            return None

        df['ema_fast'] = calculate_ema(df['close'], self.ema_fast)
        df['ema_slow'] = calculate_ema(df['close'], self.ema_slow)
        df['rsi'] = calculate_rsi(df['close'], self.rsi_period)

        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # Bullish Crossover + RSI confirmation
        if previous['ema_fast'] <= previous['ema_slow'] and latest['ema_fast'] > latest['ema_slow']:
            if latest['rsi'] < 70:
                return TradeSignal(
                    id=f"SIG_{symbol}_BUY",
                    symbol=symbol,
                    direction=SignalDirection.BUY,
                    entry=float(latest['close']),
                    stop_loss=float(latest['close'] * 0.98),
                    take_profit=float(latest['close'] * 1.04),
                    confidence=0.88,
                    size=1.0,
                    timestamp="Just now"
                )

        return None
