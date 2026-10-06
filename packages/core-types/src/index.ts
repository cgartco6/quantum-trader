export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Signal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  size: number;
  timestamp: string;
  status: SignalStatus;
}

export interface BacktestMetrics {
  totalReturn: string;
  sharpeRatio: number;
  profitFactor: number;
  maxDrawdown: string;
  winRate: string;
}

export interface TradeExecutionPayload {
  signal_id: string;
  decision: SignalStatus;
}
