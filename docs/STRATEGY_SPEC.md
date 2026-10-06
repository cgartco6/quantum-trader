# Strategy Specification Document

## Confluence Trend Model (CTM-v1)

### Indicators & Entry Logic
1. **Exponential Moving Average (EMA) Cross**:
   - Short Window: 9 periods
   - Long Window: 21 periods
   - **Bullish Signal**: EMA 9 crosses above EMA 21.
   - **Bearish Signal**: EMA 9 crosses below EMA 21.

2. **Relative Strength Index (RSI)**:
   - Period: 14
   - Overbought: > 70
   - Oversold: < 30

### Risk Parameters
* **Default Position Size**: 2% risk per trade ($R$).
* **Stop Loss**: 1.5x ATR (Average True Range) from entry price.
* **Take Profit**: 2.0x Risk-to-Reward Ratio ($1:2$).
