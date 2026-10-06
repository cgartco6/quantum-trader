from abc import ABC, abstractmethod

class ExchangeAdapter(ABC):
    @abstractmethod
    async def fetch_ticker(self, symbol: str) -> dict:
        pass

    @abstractmethod
    async def execute_order(self, symbol: str, direction: str, amount: float) -> dict:
        pass

class SimulatedExchangeAdapter(ExchangeAdapter):
    async def fetch_ticker(self, symbol: str) -> dict:
        return {"symbol": symbol, "bid": 64200.0, "ask": 64205.0}

    async def execute_order(self, symbol: str, direction: str, amount: float) -> dict:
        return {"status": "FILLED", "order_id": "SIM_12345", "filled_amount": amount}
