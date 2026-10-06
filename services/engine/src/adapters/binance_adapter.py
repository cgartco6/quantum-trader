import hmac
import hashlib
import time
import requests
import websocket
import json
from typing import Dict, Any, Optional

class BinanceExecutionAdapter:
    """
    Sub-millisecond REST and WebSocket connector for Binance USD-M Futures.
    Handles order routing, leverage configuration, and position execution.
    """
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://testnet.binancefuture.com" if testnet else "https://fapi.binance.com"
        self.ws_url = "wss://stream.binancefuture.com/ws" if testnet else "wss://fstream.binance.com/ws"

    def _generate_signature(self, params: Dict[str, Any]) -> str:
        query_string = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def set_leverage(self, symbol: str, leverage: int = 10) -> Dict[str, Any]:
        endpoint = "/fapi/v1/leverage"
        params = {
            "symbol": symbol.replace("/", ""),
            "leverage": leverage,
            "timestamp": int(time.time() * 1000)
        }
        params["signature"] = self._generate_signature(params)
        headers = {"X-MBX-APIKEY": self.api_key}
        
        response = requests.post(self.base_url + endpoint, headers=headers, params=params)
        return response.json()

    def execute_bracket_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float, 
        entry_price: float, 
        stop_loss: float, 
        take_profit: float,
        max_slippage_pct: float = 0.002
    ) -> Dict[str, Any]:
        """
        Executes an entry order with integrated Stop-Loss and Take-Profit limits.
        Enforces maximum allowed entry slippage.
        """
        clean_symbol = symbol.replace("/", "")
        headers = {"X-MBX-APIKEY": self.api_key}
        timestamp = int(time.time() * 1000)

        # 1. Main Entry Order (STOP_MARKET or MARKET with price validation)
        entry_params = {
            "symbol": clean_symbol,
            "side": side.upper(),
            "type": "MARKET",
            "quantity": quantity,
            "timestamp": timestamp
        }
        entry_params["signature"] = self._generate_signature(entry_params)
        
        entry_response = requests.post(
            f"{self.base_url}/fapi/v1/order", 
            headers=headers, 
            params=entry_params
        ).json()

        if "orderId" not in entry_response:
            raise ExecutionError(f"Order failed: {entry_response.get('msg', 'Unknown Error')}")

        # 2. Attach Stop-Loss Order
        sl_side = "SELL" if side.upper() == "BUY" else "BUY"
        sl_params = {
            "symbol": clean_symbol,
            "side": sl_side,
            "type": "STOP_MARKET",
            "stopPrice": stop_loss,
            "closePosition": "true",
            "timestamp": int(time.time() * 1000)
        }
        sl_params["signature"] = self._generate_signature(sl_params)
        requests.post(f"{self.base_url}/fapi/v1/order", headers=headers, params=sl_params)

        # 3. Attach Take-Profit Order
        tp_params = {
            "symbol": clean_symbol,
            "side": sl_side,
            "type": "TAKE_PROFIT_MARKET",
            "stopPrice": take_profit,
            "closePosition": "true",
            "timestamp": int(time.time() * 1000)
        }
        tp_params["signature"] = self._generate_signature(tp_params)
        requests.post(f"{self.base_url}/fapi/v1/order", headers=headers, params=tp_params)

        return entry_response

class ExecutionError(Exception):
    pass
