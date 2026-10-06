import pandas as pd
from services.engine.src.strategies.ema_rsi_strategy import EmaRsiStrategy
from services.engine.src.models.signal import SignalDirection

def test_ema_rsi_strategy_signal_generation():
    strategy = EmaRsiStrategy(ema_fast=2, ema_slow=4, rsi_period=2)
    
    # Simulate price action resulting in a golden cross
    data = {
        'close': [10.0, 9.5, 9.0, 11.0, 12.5, 14.0]
    }
    df = pd.DataFrame(data)
    
    signal = strategy.generate_signal(df, "BTC/USDT")
    
    assert signal is not None
    assert signal.direction == SignalDirection.BUY
    assert signal.symbol == "BTC/USDT"
    assert signal.entry == 14.0
