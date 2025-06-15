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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  ICONS,
  CARD_STYLES,
  BUTTON_STYLES,
  GRADIENTS,
  LAYOUT,
  EMOJIS
} from '../theme';

const { width: screenWidth } = Dimensions.get('window');

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
  const { walletData } = route.params;
  const { id: walletId, address, mnemonic, name } = walletData;
  
  const [balance, setBalance] = useState<Balance>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchWalletData();
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: ANIMATIONS.MEDIUM, 
      useNativeDriver: true 
    }).start();
  }, []);

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceRes = await fetch('http://192.168.18.74:8080/get-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      }

      // Fetch transactions
      const txRes = await fetch('http://192.168.18.74:8080/get-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId }),
      });
      const txData = await txRes.json();
      
      if (txData.success) {
        setTransactions(txData.data.slice(0, 3)); // Show only 3 recent
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Check connection');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToSend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Send', { walletId });
  };

  const navigateToReceive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Receive', { address });
  };

  const navigateToTransactions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Transactions', { walletId });
  };

  const navigateToWalletManager = () => {
    navigation.navigate('WalletManager');
  };

  const navigateToBackup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Backup', { mnemonic });
  };

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const renderTransaction = (tx: Transaction, index: number) => (
    <View key={tx.txid} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {tx.amount > 0 ? '↓' : '↑'}
        </Text>
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionAmount}>
          {tx.amount > 0 ? '+' : ''}{formatSats(Math.abs(tx.amount))}
        </Text>
        <Text style={styles.transactionStatus}>
          {tx.confirmations > 0 ? 'confirmed' : 'pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToWalletManager} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.walletName}>{name}</Text>
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
            <Text style={styles.balanceAmount}>
              {formatSats(balance.total)}
            </Text>
            <Text style={styles.balanceCurrency}>sats</Text>
          </View>

          {/* Action Buttons - Only 2 main actions */}
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

          {/* Recent Transactions - Minimal */}
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
  
  walletName: {
    ...TEXT_STYLES.title,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
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
    color: COLORS.TEXT_PRIMARY,
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
  
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  balanceCurrency: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  transactionStatus: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
  },
}); 