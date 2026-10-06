import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { registerForPushNotificationsAsync } from './src/services/notifications';

interface TradeSignal {
  signal_id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  confidence_score: number;
  position_size: number;
}

const WS_GATEWAY_URL = 'ws://10.0.2.2:8000/ws/signals'; // Local Android Emulator or Production Domain

export default function App() {
  const [pushToken, setPushToken] = useState<string | undefined>();
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Setup Notifications
    registerForPushNotificationsAsync().then((token) => setPushToken(token));

    // 2. Initialize Real-Time WebSocket Channel
    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    ws.current = new WebSocket(WS_GATEWAY_URL);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_SIGNAL') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setSignals((prev) => [data.signal, ...prev]);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      // Reconnect logic after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
  };

  const executeDecision = async (signal: TradeSignal, decision: 'APPROVE' | 'REJECT') => {
    setProcessingId(signal.signal_id);

    if (decision === 'APPROVE') {
      // Prompt Biometric Authentication for Trade Execution
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Confirm Order: ${signal.direction} ${signal.symbol}`,
          fallbackLabel: 'Use Device Passcode',
        });

        if (!authResult.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setProcessingId(null);
          return;
        }
      }
    }

    try {
      // Transmit decision back to Gateway API
      const response = await fetch('http://10.0.2.2:8000/api/v1/signals/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal_id: signal.signal_id,
          decision,
          executed_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        if (decision === 'APPROVE') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        // Remove processed signal from list
        setSignals((prev) => prev.filter((s) => s.signal_id !== signal.signal_id));
      } else {
        Alert.alert('Execution Error', 'Failed to submit decision to gateway.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Check connection to backend server.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>QUANTUM // MOBILE</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{isConnected ? 'LIVE' : 'DISCONNECTED'}</Text>
        </View>
      </View>

      {/* Signals Feed */}
      <ScrollView contentContainerStyle={styles.feed}>
        <Text style={styles.sectionTitle}>Active Execution Signals</Text>

        {signals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Monitoring markets... No pending approvals.</Text>
          </View>
        ) : (
          signals.map((sig) => (
            <View key={sig.signal_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, sig.direction === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                  <Text style={styles.badgeText}>{sig.direction}</Text>
                </View>
                <Text style={styles.symbolText}>{sig.symbol}</Text>
                <Text style={styles.confidenceText}>{(sig.confidence_score * 100).toFixed(0)}% Conf.</Text>
              </View>

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Entry</Text>
                  <Text style={styles.value}>${sig.entry_price.toFixed(2)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Stop Loss</Text>
                  <Text style={[styles.value, styles.slColor]}>${sig.stop_loss.toFixed(2)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Take Profit</Text>
                  <Text style={[styles.value, styles.tpColor]}>${sig.take_profit.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>Size: {sig.position_size} | RRR: 1:{sig.risk_reward_ratio}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.rejectBtn]}
                  onPress={() => executeDecision(sig, 'REJECT')}
                  disabled={processingId === sig.signal_id}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.approveBtn]}
                  onPress={() => executeDecision(sig, 'APPROVE')}
                  disabled={processingId === sig.signal_id}
                >
                  {processingId === sig.signal_id ? (
                    <ActivityIndicator color="#020617" />
                  ) : (
                    <Text style={styles.approveBtnText}>Approve & Execute</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B', // Amber 500
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  feed: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sellBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#10B981',
  },
  symbolText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  gridItem: {
    alignItems: 'flex-start',
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    color: '#F8FAFC',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
  },
  slColor: {
    color: '#EF4444',
  },
  tpColor: {
    color: '#10B981',
  },
  cardFooter: {
    marginBottom: 16,
  },
  metaText: {
    color: '#64748B',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#1E293B',
  },
  rejectBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: '#F59E0B',
  },
  approveBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
