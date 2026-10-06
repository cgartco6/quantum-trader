import asyncio
from services.engine.src.adapters.exchange_adapter import SimulatedExchangeAdapter
from services.engine.src.execution.order_router import OrderRouter

async def main():
    print("Initializing Quantum Execution Engine...")
    exchange = SimulatedExchangeAdapter()
    router = OrderRouter(exchange)
    
    ticker = await exchange.fetch_ticker("BTC/USDT")
    print(f"Connected to Exchange. Live Ticker: {ticker}")

if __name__ == "__main__":
    asyncio.run(main())
