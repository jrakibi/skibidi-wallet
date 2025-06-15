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
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WalletData } from '../../App';
import { 
  COLORS, 
  TEXT_STYLES, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  CARD_STYLES,
  BUTTON_STYLES,
  GRADIENTS,
  LAYOUT,
  EMOJIS
} from '../theme';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
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

const WALLETS_STORAGE_KEY = '@skibidi_wallets';

export default function HomeScreen({ navigation }: Props) {
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [balance, setBalance] = useState<Balance>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadWallets();
    fetchBtcPrice();
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: ANIMATIONS.MEDIUM, 
      useNativeDriver: true 
    }).start();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      fetchWalletData();
    }
  }, [selectedWallet]);

  const loadWallets = async () => {
    try {
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      if (storedWallets) {
        const parsedWallets = JSON.parse(storedWallets);
        setWallets(parsedWallets);
        if (parsedWallets.length > 0 && !selectedWallet) {
          setSelectedWallet(parsedWallets[0]);
        }
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const fetchWalletData = async () => {
    if (!selectedWallet) return;
    
    try {
      // Fetch balance
      const balanceRes = await fetch('http://172.20.10.3:8080/get-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: selectedWallet.id }),
      });
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      }

      // Fetch transactions
      const txRes = await fetch('http://172.20.10.3:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: selectedWallet.id }),
      });
      const txData = await txRes.json();
      
      if (txData.success) {
        setTransactions(txData.data.slice(0, 3)); // Show only 3 recent
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Check connection');
    }
  };

  const fetchBtcPrice = async () => {
    try {
      const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
      const data = await response.json();
      
      if (data && data.data && data.data.rates && data.data.rates.USD) {
        const usdRate = parseFloat(data.data.rates.USD);
        setBtcPrice(usdRate);
        return;
      }
    } catch (error) {
      console.log('Coinbase API failed:', error);
    }

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      
      if (data && data.bitcoin && data.bitcoin.usd) {
        const usdRate = data.bitcoin.usd;
        setBtcPrice(usdRate);
        return;
      }
    } catch (error) {
      console.log('CoinGecko API failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    await fetchBtcPrice();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToSend = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Send', { walletId: selectedWallet.id });
  };

  const navigateToReceive = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Receive', { address: selectedWallet.address });
  };

  const navigateToTransactions = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Transactions', { walletId: selectedWallet.id });
  };

  const navigateToBackup = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Backup', { mnemonic: selectedWallet.mnemonic });
  };

  const createNewWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert('Name Required', 'Enter wallet name');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await fetch('http://172.20.10.3:8080/create-wallet', {
        method: 'POST',
      });
      const json = await res.json();

      if (json.success) {
        const newWallet: WalletData = {
          id: json.data.wallet_id,
          name: newWalletName.trim(),
          address: json.data.address,
          mnemonic: json.data.mnemonic,
          balance: 0,
          createdAt: new Date().toISOString(),
        };

        const updatedWallets = [...wallets, newWallet];
        await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(updatedWallets));
        setWallets(updatedWallets);
        setSelectedWallet(newWallet);
        setShowAddModal(false);
        setNewWalletName('');
        
        // Navigate to backup screen to show seed phrase
        navigation.navigate('Backup', { mnemonic: json.data.mnemonic });
      } else {
        Alert.alert('Failed', 'Could not create wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const restoreWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Restore');
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatUSD = (sats: number) => {
    if (!btcPrice) return '';
    const btcAmount = sats / 100000000;
    const usdAmount = btcAmount * btcPrice;
    return `$${usdAmount.toFixed(2)}`;
  };

  const renderTransaction = (tx: Transaction, index: number) => (
    <View key={tx.txid} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {tx.amount > 0 ? '↓' : '↑'}
        </Text>
      </View>
      <View style={styles.transactionContent}>
        <View style={styles.transactionAmountRow}>
          <Text style={styles.transactionAmount}>
            {tx.amount > 0 ? '+' : ''}{formatSats(Math.abs(tx.amount))}
          </Text>
          <Text style={styles.transactionBitcoinSymbol}>₿</Text>
        </View>
        {btcPrice > 0 && (
          <Text style={styles.transactionUSD}>
            {formatUSD(Math.abs(tx.amount))}
          </Text>
        )}
        <Text style={styles.transactionStatus}>
          {tx.confirmations > 0 ? 'confirmed' : 'pending'}
        </Text>
      </View>
    </View>
  );

  if (wallets.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💎</Text>
          <Text style={styles.emptyTitle}>No wallets yet</Text>
          <Text style={styles.emptyText}>Create your first wallet to get started</Text>
          
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.primaryButtonText}>Create Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={restoreWallet}
            >
              <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Wallet Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Wallet</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Wallet name"
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                value={newWalletName}
                onChangeText={setNewWalletName}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewWalletName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={createNewWallet}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Header with Wallet Dropdown */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.walletSelector}
          onPress={() => setShowWalletDropdown(true)}
        >
          <Text style={styles.walletName}>{selectedWallet?.name || 'Select Wallet'}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={navigateToBackup} style={styles.backupButton}>
          <Text style={styles.backupButtonText}>🔑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
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
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {formatSats(balance.total)}
              </Text>
              <Text style={styles.bitcoinSymbol}>₿</Text>
            </View>
            {btcPrice > 0 && (
              <Text style={styles.balanceUSD}>
                {formatUSD(balance.total)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={navigateToSend}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.receiveButton]}
              onPress={navigateToReceive}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <View style={styles.transactionsContainer}>
              <TouchableOpacity onPress={navigateToTransactions} style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent</Text>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
              
              {transactions.map((tx, index) => renderTransaction(tx, index))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Wallet Dropdown Modal */}
      <Modal
        visible={showWalletDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWalletDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWalletDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Wallet</Text>
            
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletOption,
                  selectedWallet?.id === wallet.id && styles.selectedWalletOption
                ]}
                onPress={() => {
                  setSelectedWallet(wallet);
                  setShowWalletDropdown(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.walletOptionInfo}>
                  <Text style={styles.walletOptionName}>{wallet.name}</Text>
                  <Text style={styles.walletOptionAddress}>
                    {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                  </Text>
                </View>
                {selectedWallet?.id === wallet.id && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <View style={styles.dropdownActions}>
              <TouchableOpacity
                style={styles.addWalletButton}
                onPress={() => {
                  setShowWalletDropdown(false);
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.addWalletButtonText}>+ Add Wallet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.restoreWalletButton}
                onPress={() => {
                  setShowWalletDropdown(false);
                  restoreWallet();
                }}
              >
                <Text style={styles.restoreWalletButtonText}>Restore Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Wallet Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Wallet</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Wallet name"
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={newWalletName}
              onChangeText={setNewWalletName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewWalletName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.createButton}
                onPress={createNewWallet}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'Create'}
                </Text>
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
    paddingTop: LAYOUT.SAFE_AREA_TOP + SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    gap: SPACING.SM,
  },
  
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  
  backupButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backupButtonText: {
    fontSize: 18,
  },
  
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  
  balanceCard: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    marginBottom: SPACING.XL,
  },
  
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  
  bitcoinSymbol: {
    fontSize: 32,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    fontWeight: '600',
  },
  
  balanceUSD: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    fontWeight: '500',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  receiveButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  transactionsContainer: {
    marginTop: SPACING.MD,
  },
  
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  viewAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  transactionIconText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  transactionContent: {
    flex: 1,
  },
  
  transactionAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  transactionBitcoinSymbol: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  
  transactionUSD: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  
  transactionStatus: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.LG,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  
  emptyActions: {
    width: '100%',
    gap: SPACING.MD,
  },
  
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  secondaryButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  
  dropdownContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    width: '100%',
    maxHeight: '70%',
  },
  
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  
  selectedWalletOption: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  
  walletOptionInfo: {
    flex: 1,
  },
  
  walletOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  walletOptionAddress: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  
  checkMark: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  
  dropdownActions: {
    marginTop: SPACING.LG,
    gap: SPACING.SM,
  },
  
  addWalletButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  
  addWalletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  restoreWalletButton: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  restoreWalletButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    width: '100%',
    maxWidth: 300,
    gap: SPACING.LG,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  
  textInput: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  
  createButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 