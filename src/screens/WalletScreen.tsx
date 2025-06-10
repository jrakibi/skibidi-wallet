import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;
type WalletScreenRouteProp = RouteProp<RootStackParamList, 'Wallet'>;

type Props = {
  navigation: WalletScreenNavigationProp;
  route: WalletScreenRouteProp;
};

interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface Transaction {
  txid: string;
  amount: number;
  confirmations: number;
  timestamp?: number;
}

export default function WalletScreen({ navigation, route }: Props) {
  const { walletId, address, mnemonic } = route.params;
  const [balance, setBalance] = useState<Balance>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchWalletData();
    
    // Pulse animation for balance
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceRes = await fetch('http://192.168.1.5:8080/get-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      }

      // Fetch transactions
      const txRes = await fetch('http://192.168.1.5:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });
      const txData = await txRes.json();
      
      if (txData.success) {
        setTransactions(txData.data);
      }
    } catch (error) {
      Alert.alert('Connection Issues 💀', 'Cannot sync with blockchain frfr');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const navigateToSend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Send', { walletId });
  };

  const navigateToReceive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Receive', { address });
  };

  const navigateToBackup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Backup', { mnemonic });
  };

  const navigateToTransactions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Transactions', { walletId });
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatBTC = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  return (
    <LinearGradient colors={['#000', '#1a1a1a', '#333']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💀 SKIBIDI STASH 💀</Text>
          <Text style={styles.headerSubtitle}>YOUR SIGMA BITCOIN VAULT</Text>
        </View>

        <Animated.View style={[styles.balanceCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE (NO CAP)</Text>
          <Text style={styles.balanceAmount}>{formatSats(balance.total)} SATS</Text>
          <Text style={styles.balanceBTC}>≈ {formatBTC(balance.total)} BTC</Text>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceDetailLabel}>CONFIRMED ✅</Text>
              <Text style={styles.balanceDetailAmount}>{formatSats(balance.confirmed)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceDetailLabel}>UNCONFIRMED ⏳</Text>
              <Text style={styles.balanceDetailAmount}>{formatSats(balance.unconfirmed)}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.sendButton]} onPress={navigateToSend}>
            <Text style={styles.actionButtonText}>SEND</Text>
            <Text style={styles.actionButtonSubtext}>YEET SOME SATS 🚀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.receiveButton]} onPress={navigateToReceive}>
            <Text style={styles.actionButtonText}>RECEIVE</Text>
            <Text style={styles.actionButtonSubtext}>GET THAT BAG 💰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.backupButton]} onPress={navigateToBackup}>
            <Text style={styles.actionButtonText}>BACKUP</Text>
            <Text style={styles.actionButtonSubtext}>SECURE THE BAG 🔐</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.historyButton]} onPress={navigateToTransactions}>
            <Text style={styles.actionButtonText}>HISTORY</Text>
            <Text style={styles.actionButtonSubtext}>SEE THE RECEIPTS 📜</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentTransactions}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>NO TRANSACTIONS YET</Text>
              <Text style={styles.emptySubtext}>IT'S GIVING CLEAN SLATE VIBES 🧽</Text>
            </View>
          ) : (
            transactions.slice(0, 3).map((tx, index) => (
              <View key={tx.txid} style={styles.transactionItem}>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionAmount}>
                    {tx.amount > 0 ? '+' : ''}{formatSats(tx.amount)} SATS
                  </Text>
                  <Text style={styles.transactionId}>
                    {tx.txid.substring(0, 8)}...{tx.txid.substring(tx.txid.length - 8)}
                  </Text>
                </View>
                <Text style={styles.transactionStatus}>
                  {tx.confirmations > 0 ? '✅ CONFIRMED' : '⏳ PENDING'}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.disclaimer}>
          🦈 TRALALERO TRALALA APPROVED WALLET 🦈
        </Text>
        <Text style={styles.disclaimer}>
          🐊 BOMBARDIRO CROCODILO SECURED 🐊
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00FF00',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFF00',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#FF00FF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 25,
    marginBottom: 30,
    transform: [{ rotate: '-1deg' }],
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginVertical: 10,
  },
  balanceBTC: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceDetails: {
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 15,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  balanceDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  balanceDetailAmount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#FF3333',
    transform: [{ rotate: '2deg' }],
  },
  receiveButton: {
    backgroundColor: '#00FF00',
    transform: [{ rotate: '-2deg' }],
  },
  backupButton: {
    backgroundColor: '#FFFF00',
    transform: [{ rotate: '1deg' }],
  },
  historyButton: {
    backgroundColor: '#00FFFF',
    transform: [{ rotate: '-1deg' }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  actionButtonSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    marginTop: 3,
  },
  recentTransactions: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFF00',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 5,
  },
  transactionItem: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00FF00',
  },
  transactionId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 3,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFF00',
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
}); 