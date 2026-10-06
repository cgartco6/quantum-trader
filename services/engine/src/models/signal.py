from enum import Enum
from pydantic import BaseModel, Field

class SignalDirection(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TradeSignal(BaseModel):
    id: str
    symbol: str
    direction: SignalDirection
    entry: float
    stop_loss: float
    take_profit: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    size: float
    timestamp: str
