import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type TransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Transactions'>;
type TransactionScreenRouteProp = RouteProp<RootStackParamList, 'Transactions'>;

type Props = {
  navigation: TransactionScreenNavigationProp;
  route: TransactionScreenRouteProp;
};

interface Transaction {
  txid: string;
  amount: number;
  confirmations: number;
  timestamp?: number;
}

export default function TransactionScreen({ navigation, route }: Props) {
  const { walletId } = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://192.168.1.5:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });

      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
      } else {
        Alert.alert('Failed to Load 💀', 'Cannot fetch transactions frfr');
      }
    } catch (error) {
      Alert.alert('Network Error 🤡', 'Cannot connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Pending...';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getTransactionType = (amount: number) => {
    return amount > 0 ? 'RECEIVED' : 'SENT';
  };

  const getTransactionEmoji = (amount: number) => {
    return amount > 0 ? '📥' : '📤';
  };

  const getStatusEmoji = (confirmations: number) => {
    if (confirmations === 0) return '⏳';
    if (confirmations < 6) return '🔄';
    return '✅';
  };

  return (
    <LinearGradient colors={['#00FFFF', '#0099CC', '#006699']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← BACK TO STASH</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>📜 TRANSACTION HISTORY 📜</Text>
          <Text style={styles.subtitle}>ALL THE RECEIPTS FR FR</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>LOADING TRANSACTIONS...</Text>
            <Text style={styles.loadingSubtext}>FETCHING THE BLOCKCHAIN VIBES 🔄</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>NO TRANSACTIONS YET 💀</Text>
            <Text style={styles.emptyText}>Your transaction history is giving clean slate energy</Text>
            <Text style={styles.emptySubtext}>Send or receive some Bitcoin to see activity here!</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            <Text style={styles.listTitle}>
              TOTAL TRANSACTIONS: {transactions.length}
            </Text>
            
            {transactions.map((tx, index) => (
              <View key={tx.txid} style={[
                styles.transactionItem,
                { transform: [{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }] }
              ]}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionTypeContainer}>
                    <Text style={styles.transactionEmoji}>
                      {getTransactionEmoji(tx.amount)}
                    </Text>
                    <Text style={styles.transactionType}>
                      {getTransactionType(tx.amount)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: tx.amount > 0 ? '#00FF00' : '#FF3333' }
                  ]}>
                    {tx.amount > 0 ? '+' : ''}{formatSats(tx.amount)} SATS
                  </Text>
                </View>

                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionId}>
                    TXID: {tx.txid.substring(0, 12)}...{tx.txid.substring(tx.txid.length - 12)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    DATE: {formatDate(tx.timestamp)}
                  </Text>
                  <View style={styles.confirmationRow}>
                    <Text style={styles.confirmationText}>
                      {getStatusEmoji(tx.confirmations)} CONFIRMATIONS: {tx.confirmations}
                    </Text>
                    <Text style={styles.confirmationStatus}>
                      {tx.confirmations === 0 ? 'PENDING' : 
                       tx.confirmations < 6 ? 'CONFIRMING' : 'CONFIRMED'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>📖 TRANSACTION LEGEND</Text>
          <Text style={styles.legendText}>📥 RECEIVED = Bitcoin sent to you</Text>
          <Text style={styles.legendText}>📤 SENT = Bitcoin you sent out</Text>
          <Text style={styles.legendText}>⏳ PENDING = 0 confirmations</Text>
          <Text style={styles.legendText}>🔄 CONFIRMING = 1-5 confirmations</Text>
          <Text style={styles.legendText}>✅ CONFIRMED = 6+ confirmations</Text>
        </View>

        <Text style={styles.memeText}>
          🦈 TRALALERO TRALALA TRACKS YOUR TRANSACTIONS 🦈
        </Text>
        <Text style={styles.memeText}>
          🐊 BOMBARDIRO CROCODILO KEEPS THE RECORDS 🐊
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    textShadowColor: '#FFF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFF00',
    borderWidth: 4,
    borderColor: '#000',
    padding: 30,
    transform: [{ rotate: '-2deg' }],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  transactionsList: {
    marginBottom: 30,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFF00',
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
  },
  transactionItem: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    marginBottom: 15,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#CCC',
    paddingTop: 10,
  },
  transactionId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  confirmationStatus: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF6600',
  },
  legendBox: {
    backgroundColor: '#FF00FF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    marginBottom: 20,
    transform: [{ rotate: '1deg' }],
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginVertical: 2,
  },
  memeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
}); 