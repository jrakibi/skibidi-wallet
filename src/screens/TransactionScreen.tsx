import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  TEXT_STYLES, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  CARD_STYLES 
} from '../theme';

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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchTransactions();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://192.168.18.74:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });

      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
      } else {
        Alert.alert('Failed to Load', 'Unable to fetch transaction history');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Unable to connect to the network');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Pending';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (confirmations: number) => {
    if (confirmations === 0) return { status: 'Pending', color: COLORS.WARNING };
    if (confirmations < 6) return { status: 'Confirming', color: COLORS.INFO };
    return { status: 'Confirmed', color: COLORS.SUCCESS };
  };

  const getAmountColor = (amount: number) => {
    return amount > 0 ? COLORS.SUCCESS : COLORS.TEXT_PRIMARY;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptyText}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <>
              {/* Stats - Minimal */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{transactions.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {transactions.filter(tx => tx.amount > 0).length}
                    </Text>
                    <Text style={styles.statLabel}>Received</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {transactions.filter(tx => tx.amount < 0).length}
                    </Text>
                    <Text style={styles.statLabel}>Sent</Text>
                  </View>
                </View>
              </View>

              {/* Transactions List - Clean */}
              <View style={styles.transactionsList}>
                {transactions.map((tx, index) => {
                  const statusInfo = getStatusInfo(tx.confirmations);
                  
                  return (
                    <View key={tx.txid} style={styles.transactionCard}>
                      <View style={styles.transactionContent}>
                        <View style={styles.transactionLeft}>
                          <View style={styles.iconContainer}>
                            <Text style={styles.transactionIcon}>
                              {tx.amount > 0 ? '↓' : '↑'}
                            </Text>
                          </View>
                          
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionType}>
                              {tx.amount > 0 ? 'Received' : 'Sent'}
                            </Text>
                            <Text style={styles.transactionDate}>
                              {formatDate(tx.timestamp)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.transactionRight}>
                          <Text style={[
                            styles.transactionAmount,
                            { color: getAmountColor(tx.amount) }
                          ]}>
                            {tx.amount > 0 ? '+' : ''}{formatSats(Math.abs(tx.amount))}
                          </Text>
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingTop: 60,
    paddingBottom: SPACING.LG,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  placeholder: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
  },
  
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    gap: SPACING.MD,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  
  statsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
    ...SHADOWS.SUBTLE,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  
  transactionsList: {
    gap: SPACING.SM,
  },
  
  transactionCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    flex: 1,
  },
  
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  transactionIcon: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  transactionInfo: {
    gap: 2,
    flex: 1,
  },
  
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  transactionDate: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  transactionRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 