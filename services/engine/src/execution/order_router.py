from services.engine.src.adapters.exchange_adapter import ExchangeAdapter
from services.engine.src.models.signal import TradeSignal

class OrderRouter:
    def __init__(self, exchange: ExchangeAdapter):
        self.exchange = exchange

    async def route_execution(self, signal: TradeSignal) -> dict:
        print(f"[OrderRouter] Routing {signal.direction} order for {signal.symbol}...")
        result = await self.exchange.execute_order(
            symbol=signal.symbol,
            direction=signal.direction.value,
            amount=signal.size
        )
        return result
