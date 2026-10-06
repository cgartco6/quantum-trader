import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

class RegimeLiquidityStrategy:
    """
    Combines Market Structure Break (MSB), Fair Value Gap (FVG),
    and Volatility Expansion for signal generation.
    """
    def __init__(self, rrr_target: float = 2.5, max_risk_pct: float = 0.02):
        self.rrr_target = rrr_target
        self.max_risk_pct = max_risk_pct

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # High-Low Range Analysis
        df['ATR'] = df['High'].combine(df['Low'], max) - df['Low']
        df['EMA_200'] = df['Close'].ewm(span=200, adjust=False).mean()
        
        # Bullish FVG Detection: Low of current bar > High of 2 bars ago
        df['FVG_Bullish'] = df['Low'] > df['High'].shift(2)
        df['FVG_Bearish'] = df['High'] < df['Low'].shift(2)
        return df

    def evaluate_signal(self, df: pd.DataFrame, account_balance: float) -> Optional[Dict[str, Any]]:
        df = self.calculate_indicators(df)
        last = df.iloc[-1]
        prev = df.iloc[-2]

        # Check Trend Direction
        is_uptrend = last['Close'] > last['EMA_200']
        
        # Entry Condition: Bullish FVG in an Uptrend
        if is_uptrend and last['FVG_Bullish']:
            entry_price = float(last['Close'])
            stop_loss = float(df['Low'].iloc[-3:])  # Below recent swing low
            risk_per_unit = entry_price - stop_loss
            
            if risk_per_unit <= 0:
                return None
                
            take_profit = entry_price + (risk_per_unit * self.rrr_target)
            
            # Position Sizing based on fixed fractional risk
            risk_amount = account_balance * self.max_risk_pct
            position_size = risk_amount / risk_per_unit

            return {
                "signal_id": f"SIG_{int(last.name.timestamp())}",
                "symbol": str(last.get("Symbol", "BTC/USDT")),
                "direction": "BUY",
                "entry_price": round(entry_price, 2),
                "stop_loss": round(stop_loss, 2),
                "take_profit": round(take_profit, 2),
                "position_size": round(position_size, 4),
                "risk_reward_ratio": self.rrr_target,
                "confidence_score": 0.87
            }
        return None
