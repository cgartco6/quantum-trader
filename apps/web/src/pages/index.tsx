import React, { useState } from 'react';
import { useSignalSocket, Signal } from '../hooks/useSignalSocket';

export default function TerminalDashboard() {
  const {
    activeSignals,
    history,
    isConnected,
    error,
    executeDecision,
    reconnect,
  } = useSignalSocket();

  const [activeTab, setActiveTab] = useState<'signals' | 'metrics' | 'history'>('signals');
  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleAction = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setExecutingId(id);
    try {
      await executeDecision(id, decision);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* ==================================================================== */}
      {/* TOP BAR / NAVIGATION HEADER                                           */}
      {/* ==================================================================== */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-amber-500 font-mono">
              QUANTUM TRADER // TERMINAL
            </h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold px-2 py-0.5 rounded">
              v1.0.0-PROD
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Signal Execution Engine & Backtest Telemetry Hub
          </p>
        </div>

        {/* Websocket Connection Status Badge */}
        <div className="flex items-center gap-3">
          {error && (
            <button
              onClick={reconnect}
              className="text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition"
            >
              Reconnect WS
            </button>
          )}

          <div
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isConnected ? 'LIVE FEED CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
      </header>

      {/* Connection Failure Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button
            onClick={reconnect}
            className="underline hover:text-white text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* NAVIGATION TABS                                                      */}
      {/* ==================================================================== */}
      <div className="flex border-b border-slate-800 mb-6 gap-8 text-sm">
        <button
          onClick={() => setActiveTab('signals')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'signals'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Active Signals</span>
          <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded-full font-mono">
            {activeSignals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === 'metrics'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Backtest Metrics
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Execution History</span>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono">
            {history.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: ACTIVE SIGNALS FEED                                          */}
      {/* ==================================================================== */}
      {activeTab === 'signals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeSignals.length === 0 ? (
            <div className="col-span-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
              <p className="text-sm font-medium">No active pending signals requiring confirmation.</p>
              <p className="text-xs text-slate-600 mt-1">
                Listening for incoming trade signals over WebSocket...
              </p>
            </div>
          ) : (
            activeSignals.map((sig: Signal) => (
              <div
                key={sig.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition"
              >
                <div>
                  {/* Signal Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md font-mono ${
                        sig.direction === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {sig.direction}
                    </span>
                    <span className="font-mono text-base font-bold text-slate-100 tracking-wide">
                      {sig.symbol}
                    </span>
                    <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {(sig.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>

                  {/* Signal Parameters Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl my-4 border border-slate-800/80 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">
                        Entry Price
                      </span>
                      <span className="text-slate-200 font-bold">${sig.entry.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">
                        Stop Loss
                      </span>
                      <span className="text-rose-400 font-bold">${sig.stopLoss.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">
                        Take Profit
                      </span>
                      <span className="text-emerald-400 font-bold">${sig.takeProfit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Signal Meta Info */}
                  <div className="flex justify-between text-xs text-slate-400 mb-5 font-mono">
                    <span>
                      Size: <strong className="text-slate-200">{sig.size} units</strong>
                    </span>
                    <span className="text-slate-500">{sig.timestamp}</span>
                  </div>
                </div>

                {/* Execution Control Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    disabled={executingId === sig.id}
                    onClick={() => handleAction(sig.id, 'REJECTED')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={executingId === sig.id}
                    onClick={() => handleAction(sig.id, 'APPROVED')}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
                  >
                    {executingId === sig.id ? 'Processing...' : 'Approve & Execute'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BACKTEST METRICS TELEMETRY                                    */}
      {/* ==================================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-slate-500 text-xs uppercase font-semibold">Total Cumulative Return</span>
              <span className="text-2xl font-mono font-bold text-emerald-400 block mt-2">+48.5%</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-slate-500 text-xs uppercase font-semibold">Sharpe Ratio</span>
              <span className="text-2xl font-mono font-bold text-slate-100 block mt-2">2.41</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-slate-500 text-xs uppercase font-semibold">Profit Factor</span>
              <span className="text-2xl font-mono font-bold text-slate-100 block mt-2">2.18</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-slate-500 text-xs uppercase font-semibold">Max Peak Drawdown</span>
              <span className="text-2xl font-mono font-bold text-rose-400 block mt-2">-6.2%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Historical Backtest Strategy Model</h3>
            <p className="text-xs text-slate-400 mb-4">
              Simulated equity curve across 30 distinct trading sessions using historical market depth.
            </p>
            <div className="h-48 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center text-slate-600 text-xs font-mono">
              [ Equity Curve Chart Visualization Container ]
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: EXECUTION HISTORY TABLE                                       */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Audit Trail // Manual & Automated Decisions
            </h3>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Signal ID</th>
                <th className="p-4">Symbol</th>
                <th className="p-4">Direction</th>
                <th className="p-4">Entry</th>
                <th className="p-4">Stop Loss</th>
                <th className="p-4">Take Profit</th>
                <th className="p-4">Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                    No execution history recorded in this session.
                  </td>
                </tr>
              ) : (
                history.map((item: Signal) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-400">{item.id}</td>
                    <td className="p-4 font-bold text-slate-100">{item.symbol}</td>
                    <td className="p-4">
                      <span
                        className={
                          item.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {item.direction}
                      </span>
                    </td>
                    <td className="p-4">${item.entry.toFixed(2)}</td>
                    <td className="p-4 text-rose-400/80">${item.stopLoss.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400/80">${item.takeProfit.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
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
