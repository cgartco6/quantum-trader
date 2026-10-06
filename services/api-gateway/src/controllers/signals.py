"""
services/api-gateway/src/controllers/signals.py
------------------------------------------------
REST controller endpoints for managing signal feeds.
"""

from typing import List, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/signals", tags=["Signals"])

class SignalDTO(BaseModel):
    id: str
    symbol: str
    direction: str
    entry: float
    stopLoss: float
    takeProfit: float
    confidence: float
    size: float
    timestamp: str
    status: str = "PENDING"

# Shared in-memory dataset
signals_db: Dict[str, SignalDTO] = {}

@router.get("", response_model=List[SignalDTO])
async def list_active_signals():
    """Retrieve all pending active signals."""
    return list(signals_db.values())

@router.get("/{signal_id}", response_model=SignalDTO)
async def get_signal_by_id(signal_id: str):
    """Retrieve a single signal by ID."""
    if signal_id not in signals_db:
        raise HTTPException(status_code=404, detail="Signal not found.")
    return signals_db[signal_id]
