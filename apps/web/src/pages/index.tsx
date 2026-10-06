import React, { useState } from 'react';

interface Signal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  size: number;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_SIGNALS: Signal[] = [
  {
    id: 'SIG_2026_01',
    symbol: 'BTC/USDT',
    direction: 'BUY',
    entry: 64200.00,
    stopLoss: 63500.00,
    takeProfit: 65950.00,
    confidence: 0.89,
    size: 0.42,
    timestamp: '10 mins ago',
    status: 'PENDING',
  },
  {
    id: 'SIG_2026_02',
    symbol: 'ETH/USDT',
    direction: 'SELL',
    entry: 3450.00,
    stopLoss: 3510.00,
    takeProfit: 3310.00,
    confidence: 0.82,
    size: 4.5,
    timestamp: '25 mins ago',
    status: 'PENDING',
  },
  {
    id: 'SIG_2026_03',
    symbol: 'SOL/USDT',
    direction: 'BUY',
    entry: 148.50,
    stopLoss: 144.00,
    takeProfit: 158.00,
    confidence: 0.91,
    size: 35.0,
    timestamp: '1 hour ago',
    status: 'PENDING',
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'signals' | 'metrics' | 'history'>('signals');
  const [signals, setSignals] = useState<Signal[]>(INITIAL_SIGNALS);
  const [history, setHistory] = useState<Signal[]>([]);

  const handleDecision = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const targetSignal = signals.find((s) => s.id === id);
    if (!targetSignal) return;

    const updatedSignal = { ...targetSignal, status: decision };
    setHistory((prev) => [updatedSignal, ...prev]);
    setSignals((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-amber-500">QUANTUM TRADER // TERMINAL</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-Broker Execution & Confluence Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Engine Active
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('signals')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'signals' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Signals ({signals.length})
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'metrics' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Backtest Metrics
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Execution History ({history.length})
        </button>
      </div>

      {/* Main Content Body */}
      {activeTab === 'signals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              No active signals requiring manual confirmation.
            </div>
          ) : (
            signals.map((sig) => (
              <div key={sig.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded ${
                        sig.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {sig.direction}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-200">{sig.symbol}</span>
                    <span className="text-xs text-slate-400 font-mono">{(sig.confidence * 100).toFixed(0)}% Conf</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg my-3 border border-slate-800/60 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Entry</span>
                      <span className="text-slate-200">${sig.entry.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Stop Loss</span>
                      <span className="text-rose-400">${sig.stopLoss.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Take Profit</span>
                      <span className="text-emerald-400">${sig.takeProfit.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 mb-4">
                    <span>Position Size: <strong className="text-slate-200 font-mono">{sig.size}</strong></span>
                    <span>Received: {sig.timestamp}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDecision(sig.id, 'REJECTED')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision(sig.id, 'APPROVED')}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg text-xs font-bold transition"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-500 text-xs block">Total Return</span>
            <span className="text-xl font-mono font-bold text-emerald-400">+48.5%</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-500 text-xs block">Sharpe Ratio</span>
            <span className="text-xl font-mono font-bold text-slate-200">2.41</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-500 text-xs block">Profit Factor</span>
            <span className="text-xl font-mono font-bold text-slate-200">2.18</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-500 text-xs block">Max Drawdown</span>
            <span className="text-xl font-mono font-bold text-rose-400">-6.2%</span>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Signal ID</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Entry</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">No execution history recorded yet.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400">{item.id}</td>
                    <td className="p-3 font-bold text-slate-200">{item.symbol}</td>
                    <td className="p-3">{item.direction}</td>
                    <td className="p-3">${item.entry.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
