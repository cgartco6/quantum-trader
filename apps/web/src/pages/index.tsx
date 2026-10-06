import React, { useState } from 'react';

interface Signal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
}

export default function SignalDashboard() {
  const [signals, setSignals] = useState<Signal[]>([
    {
      id: 'SIG_101',
      symbol: 'BTC/USDT',
      direction: 'BUY',
      entry: 64200.0,
      stopLoss: 63500.0,
      takeProfit: 65950.0,
      confidence: 0.89,
    },
  ]);

  const handleDecision = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    // API Call to Gateway
    console.log(`Signal ${id} marked as ${decision}`);
    setSignals(signals.filter((sig) => sig.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">QUANTUM TRADER // Execution Portal</h1>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-300">Pending Signal Validations</h2>
        
        {signals.length === 0 ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-slate-500">
            No active signals require manual review.
          </div>
        ) : (
          signals.map((sig) => (
            <div key={sig.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4 flex justify-between items-center shadow-lg">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${sig.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {sig.direction}
                  </span>
                  <span className="text-lg font-bold">{sig.symbol}</span>
                  <span className="text-xs text-slate-400">Confidence: {(sig.confidence * 100).toFixed(0)}%</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-slate-500 block">Entry</span>
                    <span className="font-mono">${sig.entry.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stop Loss</span>
                    <span className="font-mono text-rose-400">${sig.stopLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Take Profit</span>
                    <span className="font-mono text-emerald-400">${sig.takeProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDecision(sig.id, 'REJECT')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleDecision(sig.id, 'APPROVE')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-semibold transition"
                >
                  Approve & Execute
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
