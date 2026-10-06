"""
services/api-gateway/src/middleware/auth.py
--------------------------------------------
API Key Authentication middleware for gateway endpoints.
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

API_KEY_HEADER = "X-Quantum-API-Key"
VALID_API_KEYS = {"quantum_secret_key_prod_123", "dev_local_key"}

class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow open access to health and docs endpoints
        if request.url.path in ["/health", "/docs", "/openapi.json"] or request.url.path.startswith("/ws/"):
            return await call_next(request)

        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key or api_key not in VALID_API_KEYS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-Quantum-API-Key header."
            )

        response = await call_next(request)
        return response
