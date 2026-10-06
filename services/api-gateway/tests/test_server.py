"""
services/api-gateway/tests/test_server.py
------------------------------------------
Pytest unit and integration test suite for the FastAPI Gateway Server.
Tests REST endpoints, WebSocket streaming, state mutation, and broadcasting.
"""

import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect

# Import app, in-memory data structures, and schemas from server
from services.api_gateway.src.server import (
    app,
    active_signals,
    execution_history,
    Signal,
    SignalDirection,
    SignalStatus,
)


@pytest.fixture(autouse=True)
def reset_in_memory_db():
    """
    Autouse fixture to reset in-memory state before every test.
    Ensures total test isolation.
    """
    active_signals.clear()
    execution_history.clear()

    # Populate baseline fixtures
    active_signals["SIG_TEST_01"] = Signal(
        id="SIG_TEST_01",
        symbol="BTC/USDT",
        direction=SignalDirection.BUY,
        entry=65000.00,
        stopLoss=64000.00,
        takeProfit=67000.00,
        confidence=0.92,
        size=0.5,
        timestamp="Just now",
        status=SignalStatus.PENDING,
    )
    active_signals["SIG_TEST_02"] = Signal(
        id="SIG_TEST_02",
        symbol="ETH/USDT",
        direction=SignalDirection.SELL,
        entry=3500.00,
        stopLoss=3550.00,
        takeProfit=3400.00,
        confidence=0.85,
        size=3.0,
        timestamp="5 mins ago",
        status=SignalStatus.PENDING,
    )
    yield


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    return TestClient(app)


# ------------------------------------------------------------------
# 1. REST ENDPOINT TESTS
# ------------------------------------------------------------------

def test_health_check(client: TestClient):
    """Test health check route returns status 200 and online status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "timestamp" in data


def test_get_active_signals(client: TestClient):
    """Test retrieving active pending signals."""
    response = client.get("/api/v1/signals")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] in ["SIG_TEST_01", "SIG_TEST_02"]


def test_get_execution_history_empty(client: TestClient):
    """Test history endpoint returns empty list initially."""
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    assert response.json() == []


def test_get_backtest_metrics(client: TestClient):
    """Test retrieving strategy backtest metrics."""
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "sharpeRatio" in data
    assert "profitFactor" in data
    assert data["sharpeRatio"] == 2.41


def test_execute_trade_approval_success(client: TestClient):
    """Test approving a signal via REST endpoint."""
    payload = {"signal_id": "SIG_TEST_01", "decision": "APPROVED"}
    response = client.post("/api/v1/execute", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["signal_id"] == "SIG_TEST_01"

    # Verify state updates: removed from active, added to history
    assert "SIG_TEST_01" not in active_signals
    assert len(execution_history) == 1
    assert execution_history[0].id == "SIG_TEST_01"
    assert execution_history[0].status == SignalStatus.APPROVED


def test_execute_trade_rejection_success(client: TestClient):
    """Test rejecting a signal via REST endpoint."""
    payload = {"signal_id": "SIG_TEST_02", "decision": "REJECTED"}
    response = client.post("/api/v1/execute", json=payload)

    assert response.status_code == 200
    assert "SIG_TEST_02" not in active_signals
    assert len(execution_history) == 1
    assert execution_history[0].status == SignalStatus.REJECTED


def test_execute_trade_not_found_returns_404(client: TestClient):
    """Test executing a non-existent or previously processed signal returns 404."""
    payload = {"signal_id": "SIG_NONEXISTENT", "decision": "APPROVED"}
    response = client.post("/api/v1/execute", json=payload)

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ------------------------------------------------------------------
# 2. WEBSOCKET ENDPOINT TESTS
# ------------------------------------------------------------------

def test_websocket_connection_and_initial_state(client: TestClient):
    """Test WebSocket connection receives initial state payload on connect."""
    with client.websocket_connect("/ws/signals") as websocket:
        data = websocket.receive_json()
        assert data["event"] == "INITIAL_STATE"
        assert len(data["active_signals"]) == 2
        assert len(data["history"]) == 0


def test_websocket_ping_pong_heartbeat(client: TestClient):
    """Test sending ping text returns pong JSON frame."""
    with client.websocket_connect("/ws/signals") as websocket:
        _ = websocket.receive_json()  # Flush initial state

        websocket.send_text("ping")
        response = websocket.receive_json()

        assert response["event"] == "pong"
        assert "timestamp" in response


def test_websocket_realtime_broadcast_on_execute(client: TestClient):
    """Integration test: Verify REST trade execution broadcasts payload over active WebSocket."""
    with client.websocket_connect("/ws/signals") as websocket:
        _ = websocket.receive_json()  # Flush initial state

        # Trigger execution request via REST
        payload = {"signal_id": "SIG_TEST_01", "decision": "APPROVED"}
        response = client.post("/api/v1/execute", json=payload)
        assert response.status_code == 200

        # Receive real-time broadcast message on WebSocket client
        broadcast_data = websocket.receive_json()

        assert broadcast_data["event"] == "SIGNAL_UPDATED"
        assert broadcast_data["action"] == "APPROVED"
        assert broadcast_data["signal"]["id"] == "SIG_TEST_01"
        assert broadcast_data["signal"]["status"] == "APPROVED"


def test_websocket_multiple_clients_broadcast(client: TestClient):
    """Integration test: Broadcast signal update simultaneously to multiple connected WebSocket clients."""
    with client.websocket_connect("/ws/signals") as ws1, client.websocket_connect("/ws/signals") as ws2:
        _ = ws1.receive_json()
        _ = ws2.receive_json()

        # Perform REST action
        client.post("/api/v1/execute", json={"signal_id": "SIG_TEST_02", "decision": "REJECTED"})

        # Both subscribers receive the broadcast
        msg1 = ws1.receive_json()
        msg2 = ws2.receive_json()

        assert msg1["event"] == "SIGNAL_UPDATED"
        assert msg2["event"] == "SIGNAL_UPDATED"
        assert msg1["signal"]["id"] == "SIG_TEST_02"
        assert msg2["signal"]["id"] == "SIG_TEST_02"
