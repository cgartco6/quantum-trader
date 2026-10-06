import React from 'react';
import { useSignalSocket } from '../hooks/useSignalSocket';

export default function TerminalDashboard() {
  const { activeSignals, history, isConnected, executeDecision, error } = useSignalSocket();

  return (
    <div>
      <div className="connection-status">
        Status: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        {error && <p className="error">{error}</p>}
      </div>

      {/* Approve Signal */}
      <button onClick={() => executeDecision('SIG_2026_01', 'APPROVED')}>
        Approve Trade
      </button>
    </div>
  );
}
