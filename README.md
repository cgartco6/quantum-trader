# Quantum Trader Terminal

An automated trading execution engine, backtesting framework, and live signals web terminal built as a modular microservices monorepo.

## 🚀 Repository Structure

```text
quantum-trader/
├── .github/workflows/       # CI/CD Actions for Pytest and Docker builds
├── apps/
│   └── web/                 # Next.js 14 dashboard UI & WebSocket consumer
├── docs/                    # Architecture diagrams & Strategy specs
├── packages/
│   └── ui-components/       # Shared React chart components & UI primitive library
├── services/
│   ├── api-gateway/         # FastAPI REST routes and WebSocket streaming engine
│   ├── engine/              # Python strategy execution engine & technical indicators
│   └── telegram-bot/        # Interactive Telegram approval bot
├── docker-compose.yml       # Local multi-container orchestration setup
└── README.md
