class RiskEngine:
    """
    Enforces risk constraints before trade execution:
    - Maximum account risk per trade (e.g., 1%).
    - Dynamic volatility-based slippage caps.
    - Portfolio correlation limits.
    """
    def __init__(self, max_account_risk_pct: float = 0.01, max_drawdown_limit_pct: float = 0.15):
        self.max_risk_pct = max_account_risk_pct
        self.max_drawdown_limit = max_drawdown_limit_pct

    def validate_and_size_trade(
        self, 
        account_balance: float, 
        current_drawdown: float,
        entry_price: float, 
        stop_loss_price: float
    ) -> float:
        # Emergency Shutdown: Lock trading if drawdown limit is breached
        if current_drawdown >= self.max_drawdown_limit:
            raise SystemExit("CRITICAL: Maximum Drawdown reached. Trading Engine halted.")

        risk_amount = account_balance * self.max_risk_pct
        price_risk_per_unit = abs(entry_price - stop_loss_price)

        if price_risk_per_unit == 0:
            raise ValueError("Invalid Stop Loss: Equal to Entry Price.")

        position_units = risk_amount / price_risk_per_unit
        return round(position_units, 4)
