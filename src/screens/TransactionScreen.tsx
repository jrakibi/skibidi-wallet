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
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  note?: string;
}

interface TransactionNote {
  txid: string;
  note: string;
}

export default function TransactionScreen({ navigation, route }: Props) {
  const { walletId } = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [noteText, setNoteText] = useState('');

  const NOTES_STORAGE_KEY = `@transaction_notes_${walletId}`;

  useEffect(() => {
    fetchTransactions();
    fetchBtcPrice();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchBtcPrice = async () => {
    try {
      // Try Coinbase API first
      const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
      const data = await response.json();
      
      if (data && data.data && data.data.rates && data.data.rates.USD) {
        const usdRate = parseFloat(data.data.rates.USD);
        setBtcPrice(usdRate);
        console.log('BTC price fetched successfully:', usdRate);
        return;
      }
    } catch (error) {
      console.log('Coinbase API failed:', error);
    }

    try {
      // Fallback to CoinGecko API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      
      if (data && data.bitcoin && data.bitcoin.usd) {
        const usdRate = data.bitcoin.usd;
        setBtcPrice(usdRate);
        console.log('BTC price fetched from CoinGecko:', usdRate);
        return;
      }
    } catch (error) {
      console.log('CoinGecko API failed:', error);
    }

    console.log('All BTC price APIs failed - USD conversion disabled');
  };

  const loadTransactionNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      return storedNotes ? JSON.parse(storedNotes) : [];
    } catch (error) {
      return [];
    }
  };

  const saveTransactionNote = async (txid: string, note: string) => {
    try {
      const existingNotes: TransactionNote[] = await loadTransactionNotes();
      const updatedNotes = existingNotes.filter(n => n.txid !== txid);
      if (note.trim()) {
        updatedNotes.push({ txid, note: note.trim() });
      }
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
      
      // Update local transactions with note
      setTransactions(prev => prev.map(tx => 
        tx.txid === txid ? { ...tx, note: note.trim() } : tx
      ));
    } catch (error) {
      Alert.alert('Error', 'Could not save note');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://192.168.1.10:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });

      const result = await response.json();

      if (result.success) {
        // Load saved notes
        const savedNotes: TransactionNote[] = await loadTransactionNotes();
        const notesMap = savedNotes.reduce((acc, note) => {
          acc[note.txid] = note.note;
          return acc;
        }, {} as Record<string, string>);

        // Merge transactions with notes
        const transactionsWithNotes = result.data.map((tx: Transaction) => ({
          ...tx,
          note: notesMap[tx.txid] || ''
        }));

        setTransactions(transactionsWithNotes);
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
    await fetchBtcPrice();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatUSD = (sats: number) => {
    if (!btcPrice) return '';
    const btcAmount = sats / 100000000; // Convert sats to BTC
    const usdAmount = btcAmount * btcPrice;
    return `$${usdAmount.toFixed(2)}`;
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

  const openNoteModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setNoteText(tx.note || '');
    setShowNoteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveNote = async () => {
    if (!selectedTx) return;
    
    await saveTransactionNote(selectedTx.txid, noteText);
    setShowNoteModal(false);
    setSelectedTx(null);
    setNoteText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                    <TouchableOpacity 
                      key={tx.txid} 
                      style={styles.transactionCard}
                      onPress={() => openNoteModal(tx)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionContent}>
                        <View style={styles.transactionLeft}>
                          <View style={styles.iconContainer}>
                            <Text style={styles.transactionIcon}>
                              {tx.amount > 0 ? '↓' : '↑'}
                            </Text>
                          </View>
                          
                          <View style={styles.transactionInfo}>
                            <View style={styles.transactionHeader}>
                              <Text style={styles.transactionType}>
                                {tx.amount > 0 ? 'Received' : 'Sent'}
                              </Text>
                              {tx.note && (
                                <View style={styles.noteIndicator}>
                                  <Text style={styles.noteIndicatorText}>📝</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.transactionDate}>
                              {formatDate(tx.timestamp)}
                            </Text>
                            {tx.note && (
                              <Text style={styles.notePreview} numberOfLines={1}>
                                {tx.note}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.transactionRight}>
                          <View style={styles.amountRow}>
                            <Text style={[
                              styles.transactionAmount,
                              { color: getAmountColor(tx.amount) }
                            ]}>
                              {tx.amount > 0 ? '+' : ''}{formatSats(Math.abs(tx.amount))}
                            </Text>
                            <Text style={styles.bitcoinSymbol}>₿</Text>
                          </View>
                          {btcPrice > 0 && (
                            <Text style={styles.transactionUSD}>
                              {formatUSD(Math.abs(tx.amount))}
                            </Text>
                          )}
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.status}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Note</Text>
            
            {selectedTx && (
              <View style={styles.transactionSummary}>
                <View style={styles.summaryAmountRow}>
                  <Text style={styles.summaryAmount}>
                    {selectedTx.amount > 0 ? '+' : ''}{formatSats(Math.abs(selectedTx.amount))}
                  </Text>
                  <Text style={styles.summaryBitcoinSymbol}>₿</Text>
                </View>
                {btcPrice > 0 && (
                  <Text style={styles.summaryUSD}>
                    {formatUSD(Math.abs(selectedTx.amount))}
                  </Text>
                )}
                <Text style={styles.summaryDate}>
                  {formatDate(selectedTx.timestamp)}
                </Text>
              </View>
            )}
            
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this transaction..."
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              autoFocus
              maxLength={200}
            />
            
            <Text style={styles.characterCount}>
              {noteText.length}/200
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveNote}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
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
  
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  bitcoinSymbol: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  transactionUSD: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  noteIndicator: {
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 12,
    padding: 2,
  },
  
  noteIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.BACKGROUND,
  },
  
  notePreview: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    width: '80%',
    maxHeight: '80%',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  transactionSummary: {
    marginBottom: SPACING.MD,
  },
  
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  summaryBitcoinSymbol: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  summaryUSD: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  summaryDate: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  noteInput: {
    flex: 1,
    padding: SPACING.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  
  cancelButton: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BACKGROUND,
  },
  
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
  },
  
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BACKGROUND,
  },
}); 