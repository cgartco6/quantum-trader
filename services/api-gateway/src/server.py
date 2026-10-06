"""
services/api-gateway/src/server.py
-----------------------------------
API Gateway for Quantum Trader Terminal.
Provides REST routes for manual trade approval/rejection and backtest telemetry,
and a WebSocket endpoint for streaming real-time signal updates.
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ------------------------------------------------------------------
# 1. SCHEMAS & MODELS
# ------------------------------------------------------------------

class SignalDirection(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class SignalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Signal(BaseModel):
    id: str = Field(..., example="SIG_2026_01")
    symbol: str = Field(..., example="BTC/USDT")
    direction: SignalDirection
    entry: float = Field(..., example=64200.00)
    stopLoss: float = Field(..., example=63500.00)
    takeProfit: float = Field(..., example=65950.00)
    confidence: float = Field(..., ge=0.0, le=1.0, example=0.89)
    size: float = Field(..., example=0.42)
    timestamp: str = Field(..., example="Just now")
    status: SignalStatus = Field(default=SignalStatus.PENDING)


class TradeExecutionRequest(BaseModel):
    signal_id: str
    decision: SignalStatus


class TradeExecutionResponse(BaseModel):
    status: str
    signal_id: str
    executed_at: str
    details: str


class BacktestMetrics(BaseModel):
    totalReturn: str = "+48.5%"
    sharpeRatio: float = 2.41
    profitFactor: float = 2.18
    maxDrawdown: str = "-6.2%"
    winRate: str = "68.4%"


# ------------------------------------------------------------------
# 2. WEBSOCKET CONNECTION MANAGER
# ------------------------------------------------------------------

class ConnectionManager:
    """Manages active WebSocket connections and broadcasts real-time signal streams."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Broadcast payload to all connected frontend client dashboards."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        # Clean up dropped connections
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()

# ------------------------------------------------------------------
# 3. FASTAPI APP INITIALIZATION & IN-MEMORY STORE
# ------------------------------------------------------------------

app = FastAPI(
    title="Quantum Trader Gateway API",
    description="REST & WebSocket API for signal feeds and execution controls.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend running locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for signals and execution history
active_signals: Dict[str, Signal] = {
    "SIG_2026_01": Signal(
        id="SIG_2026_01",
        symbol="BTC/USDT",
        direction=SignalDirection.BUY,
        entry=64200.00,
        stopLoss=63500.00,
        takeProfit=65950.00,
        confidence=0.89,
        size=0.42,
        timestamp="10 mins ago",
        status=SignalStatus.PENDING,
    ),
    "SIG_2026_02": Signal(
        id="SIG_2026_02",
        symbol="ETH/USDT",
        direction=SignalDirection.SELL,
        entry=3450.00,
        stopLoss=3510.00,
        takeProfit=3310.00,
        confidence=0.82,
        size=4.5,
        timestamp="25 mins ago",
        status=SignalStatus.PENDING,
    ),
    "SIG_2026_03": Signal(
        id="SIG_2026_03",
        symbol="SOL/USDT",
        direction=SignalDirection.BUY,
        entry=148.50,
        stopLoss=144.00,
        takeProfit=158.00,
        confidence=0.91,
        size=35.0,
        timestamp="1 hour ago",
        status=SignalStatus.PENDING,
    ),
}

execution_history: List[Signal] = []


# ------------------------------------------------------------------
# 4. REST ENDPOINTS
# ------------------------------------------------------------------

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "online", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/v1/signals", response_model=List[Signal])
async def get_active_signals():
    """Retrieve all pending active trading signals."""
    return list(active_signals.values())


@app.get("/api/v1/history", response_model=List[Signal])
async def get_execution_history():
    """Retrieve history of executed or rejected signals."""
    return execution_history


@app.get("/api/v1/metrics", response_model=BacktestMetrics)
async def get_backtest_metrics():
    """Retrieve current backtest strategy telemetry."""
    return BacktestMetrics()


@app.post("/api/v1/execute", response_model=TradeExecutionResponse)
async def execute_trade(payload: TradeExecutionRequest):
    """
    Approve or Reject an active signal. Moves signal from pending active set
    to execution history and broadcasts the update over WebSockets.
    """
    if payload.signal_id not in active_signals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal '{payload.signal_id}' not found or already processed."
        )

    signal = active_signals.pop(payload.signal_id)
    signal.status = payload.decision
    execution_history.insert(0, signal)

    # Prepare notification payload
    event_payload = {
        "event": "SIGNAL_UPDATED",
        "signal": signal.dict(),
        "action": payload.decision
    }

    # Broadcast decision to all connected frontend clients
    await manager.broadcast(event_payload)

    return TradeExecutionResponse(
        status="success",
        signal_id=signal.id,
        executed_at=datetime.utcnow().isoformat(),
        details=f"Signal {signal.id} marked as {payload.decision}."
    )


# ------------------------------------------------------------------
# 5. WEBSOCKET ENDPOINT
# ------------------------------------------------------------------

@app.websocket("/ws/signals")
async def websocket_signals_endpoint(websocket: WebSocket):
    """
    WebSocket channel for real-time signal broadcasts and UI state synchronization.
    """
    await manager.connect(websocket)
    try:
        # Send initial state snapshot on connect
        initial_payload = {
            "event": "INITIAL_STATE",
            "active_signals": [s.dict() for s in active_signals.values()],
            "history": [s.dict() for s in execution_history]
        }
        await manager.send_json(initial_payload, websocket)

        # Keep connection open and listen for client heartbeats/messages
        while True:
            data = await websocket.receive_text()
            # Respond to ping heartbeats from client
            if data == "ping":
                await websocket.send_json({"event": "pong", "timestamp": datetime.utcnow().isoformat()})

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ------------------------------------------------------------------
# 6. APPLICATION ENTRYPOINT
# ------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
