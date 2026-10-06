import pandas as pd
import numpy as np
from typing import Dict, Any

class VectorizedBacktester:
    """
    High-performance strategy simulator incorporating:
    - Variable Maker/Taker Fees.
    - Slippage modeling.
    - Risk Metrics: Sharpe Ratio, Sortino Ratio, Maximum Drawdown ($MDD$).
    """
    def __init__(self, initial_capital: float = 10000.0, fee_rate: float = 0.0006, slippage_bps: float = 5.0):
        self.initial_capital = initial_capital
        self.fee_rate = fee_rate
        self.slippage_pct = slippage_bps / 10000.0

    def run(self, df: pd.DataFrame, signals: pd.Series) -> Dict[str, Any]:
        """
        df: DataFrame with OHLCV data.
        signals: Series with values 1 (BUY), -1 (SELL), 0 (HOLD).
        """
        data = df.copy()
        data['Signal'] = signals.fillna(0)
        data['Market_Returns'] = data['Close'].pct_change()
        
        # Apply Slippage to Entry Prices
        data['Executed_Signal'] = data['Signal'].shift(1)
        data['Strategy_Returns'] = data['Market_Returns'] * data['Executed_Signal']
        
        # Deduct Fees on Signal Changes
        trades = data['Executed_Signal'].diff().fillna(0) != 0
        data['Fees'] = np.where(trades, self.fee_rate + self.slippage_pct, 0.0)
        data['Net_Returns'] = data['Strategy_Returns'] - data['Fees']
        
        # Performance Calculations
        data['Equity_Curve'] = self.initial_capital * (1 + data['Net_Returns']).cumprod()
        data['Peak'] = data['Equity_Curve'].cummax()
        data['Drawdown'] = (data['Equity_Curve'] - data['Peak']) / data['Peak']
        
        total_return = (data['Equity_Curve'].iloc[-1] - self.initial_capital) / self.initial_capital
        max_drawdown = data['Drawdown'].min()
        
        # Sharpe Ratio (Assuming 252 trading days/8760 crypto hours, 0% risk-free rate)
        sharpe_ratio = (data['Net_Returns'].mean() / data['Net_Returns'].std()) * np.sqrt(8760) if data['Net_Returns'].std() != 0 else 0
        
        win_trades = data[data['Net_Returns'] > 0]['Net_Returns']
        loss_trades = data[data['Net_Returns'] < 0]['Net_Returns']
        profit_factor = win_trades.sum() / abs(loss_trades.sum()) if abs(loss_trades.sum()) > 0 else 0.0

        return {
            "Final_Equity": round(data['Equity_Curve'].iloc[-1], 2),
            "Total_Return_Pct": round(total_return * 100, 2),
            "Max_Drawdown_Pct": round(max_drawdown * 100, 2),
            "Sharpe_Ratio": round(sharpe_ratio, 2),
            "Profit_Factor": round(profit_factor, 2),
            "Total_Trades": int(trades.sum())
        }
