import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Signal } from '@quantum/core-types';

export default function App() {
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    // Fetch signals from API Gateway
    fetch('http://10.0.2.2:8000/api/v1/signals')
      .then((res) => res.json())
      .then((data) => setSignals(data))
      .catch((err) => console.log('Error fetching signals:', err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quantum Trader Mobile</Text>
      <FlatList
        data={signals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.symbol}>{item.symbol} - {item.direction}</Text>
            <Text style={styles.details}>Entry: ${item.entry} | SL: ${item.stopLoss}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f59e0b', marginBottom: 20 },
  card: { backgroundColor: '#0f172a', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  symbol: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
  details: { color: '#94a3b8', fontSize: 12, marginTop: 5 },
});
