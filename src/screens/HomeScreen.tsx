import React, { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
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
  EMOJIS,
  TYPOGRAPHY
} from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { getApiUrl } from '../config';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
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

// Add BTC price state interface
interface BTCPrice {
  usd: number;
  lastUpdated: number;
}

const WALLETS_STORAGE_KEY = '@skibidi_wallets';

// Available brainrot icons
const BRAINROT_ICONS = [
  require('../../assets/brainrot/brainrot1.png'),
  require('../../assets/brainrot/brainrot2.png'),
  require('../../assets/brainrot/brainrot3.png'),
  require('../../assets/brainrot/brainrot4.png'),
  require('../../assets/brainrot/brainrot5.png'),
  require('../../assets/brainrot/brainrot6.png'),
];

// Available wallet cards - mapped to brainrot selection
const WALLET_CARDS = [
  require('../../assets/cards/card1.png'),
  require('../../assets/cards/card2.png'),
  require('../../assets/cards/card3.png'),
  require('../../assets/cards/card4.png'),
  require('../../assets/cards/card5.png'),
  require('../../assets/cards/card6.png'),
];

// Function to get icon for wallet based on iconIndex
const getWalletIcon = (wallet: WalletData, fallbackIndex: number = 0) => {
  const iconIndex = wallet.iconIndex !== undefined ? wallet.iconIndex : fallbackIndex;
  return BRAINROT_ICONS[iconIndex % BRAINROT_ICONS.length];
};

// Function to get card for wallet based on iconIndex (brainrot selection)
const getWalletCard = (wallet: WalletData, fallbackIndex: number = 0) => {
  const iconIndex = wallet.iconIndex !== undefined ? wallet.iconIndex : fallbackIndex;
  return WALLET_CARDS[iconIndex % WALLET_CARDS.length];
};

export default function HomeScreen({ navigation, route }: Props) {
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [balance, setBalance] = useState<Balance>({ confirmed: 0, unconfirmed: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(false);
  // Add BTC price state
  const [btcPrice, setBtcPrice] = useState<BTCPrice>({ usd: 0, lastUpdated: 0 });
  
  // Add ref to track if fetch is in progress to prevent multiple simultaneous calls
  const fetchInProgressRef = useRef(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [cardScaleAnim] = useState(new Animated.Value(1));
  const [cardOpacityAnim] = useState(new Animated.Value(1));
  const [modalSlideAnim] = useState(new Animated.Value(height));
  const [cardFloatX] = useState(new Animated.Value(0));
  const [cardFloatY] = useState(new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadWallets();
    fetchBTCPrice(); // Add BTC price fetching on mount
    
    // Check if a specific wallet was passed from navigation
    if (route.params?.selectedWallet) {
      console.log('Setting wallet from route params:', route.params.selectedWallet.name);
      setSelectedWallet(route.params.selectedWallet);
    }
    
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: ANIMATIONS.MEDIUM, 
        useNativeDriver: true 
      }),
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: ANIMATIONS.MEDIUM, 
        useNativeDriver: true 
      })
    ]).start();

    // Start floating animation for the card
    startCardFloatingAnimation();
  }, []); // Remove route.params dependency to prevent re-running on every navigation

  // Handle route params for selected wallet
  useEffect(() => {
    if (route.params?.selectedWallet && route.params.selectedWallet.id !== selectedWallet?.id) {
      console.log('Route params changed, setting new wallet:', route.params.selectedWallet.name);
      setSelectedWallet(route.params.selectedWallet);
    }
  }, [route.params?.selectedWallet?.id]);

  useEffect(() => {
    if (selectedWallet) {
      console.log('Selected wallet changed, fetching data for:', selectedWallet.name, selectedWallet.id);
      fetchWalletData();
    }
  }, [selectedWallet?.id]); // Only trigger when wallet ID changes, not the entire object

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, refreshing wallet list and data');
      // Always refresh wallet list when screen comes into focus
      loadWallets();
      
      // Only refresh wallet data if we have a selected wallet and we're not already loading
      if (selectedWallet && !isLoadingWalletData) {
        console.log('Screen focused, refreshing wallet data for:', selectedWallet.name);
        // Add a small delay to prevent rapid-fire calls
        setTimeout(() => {
          if (selectedWallet && !fetchInProgressRef.current) {
            fetchWalletData();
          }
        }, 100);
      }
    }, [selectedWallet?.id]) // Remove isLoadingWalletData from dependencies to prevent infinite loop
  );

  const loadWallets = async () => {
    try {
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      if (storedWallets) {
        const parsedWallets = JSON.parse(storedWallets);
        const oldWalletCount = wallets.length;
        setWallets(parsedWallets);
        
        // Auto-select first wallet if no wallet is currently selected
        if (parsedWallets.length > 0 && !selectedWallet) {
          console.log('No wallet selected, auto-selecting first wallet:', parsedWallets[0].name);
          setSelectedWallet(parsedWallets[0]);
        }
        // If we have new wallets (e.g., just created one), select the newest one
        else if (parsedWallets.length > oldWalletCount && oldWalletCount > 0) {
          const newestWallet = parsedWallets[parsedWallets.length - 1];
          console.log('New wallet detected, selecting newest wallet:', newestWallet.name);
          setSelectedWallet(newestWallet);
        }
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // Add BTC price fetching function
  const fetchBTCPrice = async () => {
    try {
      // Check if we have recent price data (less than 5 minutes old)
      const now = Date.now();
      if (btcPrice.usd > 0 && (now - btcPrice.lastUpdated) < 5 * 60 * 1000) {
        return; // Use cached price
      }

      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      
      if (data.bitcoin && data.bitcoin.usd) {
        setBtcPrice({
          usd: data.bitcoin.usd,
          lastUpdated: now
        });
      }
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      // Fallback to a reasonable BTC price if API fails
      if (btcPrice.usd === 0) {
        setBtcPrice({
          usd: 45000, // Fallback price
          lastUpdated: Date.now()
        });
      }
    }
  };

  const fetchWalletData = async () => {
    if (!selectedWallet || isLoadingWalletData || fetchInProgressRef.current) {
      console.log('Skipping wallet data fetch - no wallet selected, already loading, or fetch in progress');
      return;
    }
    
    fetchInProgressRef.current = true;
    setIsLoadingWalletData(true);
    console.log('Fetching data for wallet:', selectedWallet.id, selectedWallet.name);
    
    try {
      // Fetch balance
      const balanceRes = await fetch(getApiUrl('/get-balance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: selectedWallet.mnemonic }),
      });
      const balanceData = await balanceRes.json();
      
      console.log('Balance response:', balanceData);
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      } else {
        console.error('Balance fetch failed:', balanceData.error || balanceData.message);
        // Don't show error for invalid mnemonic - it might be a corrupted wallet
        if (!balanceData.error?.includes('Invalid mnemonic')) {
          Alert.alert('Balance Error', balanceData.error || 'Failed to fetch balance');
        }
      }

      // Fetch transactions
      const txRes = await fetch(getApiUrl('/get-transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: selectedWallet.mnemonic }),
      });
      const txData = await txRes.json();
      
      console.log('Transactions response:', txData);
      
      if (txData.success) {
        setTransactions(txData.data || []);
      } else {
        console.error('Transactions fetch failed:', txData.error || txData.message);
        // Don't show error for invalid mnemonic - it might be a corrupted wallet
        if (!txData.error?.includes('Invalid mnemonic')) {
          Alert.alert('Transactions Error', txData.error || 'Failed to fetch transactions');
        }
      }
    } catch (error) {
      console.error('Wallet data fetch error:', error);
      Alert.alert('Network Error', 'Check your connection and try again');
    } finally {
      setIsLoadingWalletData(false);
      fetchInProgressRef.current = false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWalletData(),
      fetchBTCPrice() // Also refresh BTC price on pull-to-refresh
    ]);
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate modal slide up
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeWalletModal = () => {
    // Animate modal slide down
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowWalletModal(false);
    });
  };

  const selectWallet = (wallet: WalletData) => {
    console.log('Selecting wallet:', wallet.name, wallet.id);
    
    // Clear previous wallet data immediately to prevent showing stale data
    setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
    setTransactions([]);
    
    // Set the new wallet - useEffect will handle fetching data automatically
    setSelectedWallet(wallet);
    
    closeWalletModal();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const navigateToSend = () => {
    if (!selectedWallet || isAnimating) return;
    
    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Start zoom animation sequence focusing on the skibidi character (right side of card)
    Animated.sequence([
      // Phase 1: Zoom into the skibidi character on the right side of the card
      Animated.parallel([
        Animated.timing(cardScaleAnim, {
          toValue: 8, // Zoom in much more
          duration: 1000,
          useNativeDriver: true,
        }),
        // Move the card to focus on the skibidi character (shift left to show right side)
        Animated.timing(slideAnim, {
          toValue: -width * 0.3, // Shift left to focus on right side of card
          duration: 1000,
          useNativeDriver: true,
        }),
        // Fade out all other elements
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Complete fade to prepare for navigation
      Animated.timing(cardOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animations and navigate
      cardScaleAnim.setValue(1);
      cardOpacityAnim.setValue(1);
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      setIsAnimating(false);
      navigation.navigate('Send', { walletId: selectedWallet.id, walletMnemonic: selectedWallet.mnemonic });
    });
  };

  const navigateToReceive = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Receive', { address: selectedWallet.address });
  };

  const navigateToBackup = () => {
    if (!selectedWallet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Backup', { mnemonic: selectedWallet.mnemonic });
  };

  const restoreWallet = () => {
    closeWalletModal();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Restore');
  };

  const openCreateWalletModal = () => {
    closeWalletModal();
    // Navigate to the dedicated Create Wallet screen
    navigation.navigate('CreateWallet');
  };

  const deleteWallet = async (walletToDelete: WalletData) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${walletToDelete.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedWallets = wallets.filter(w => w.id !== walletToDelete.id);
              setWallets(updatedWallets);
              await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(updatedWallets));
              
              // If we deleted the last wallet, navigate to splash screen
              if (updatedWallets.length === 0) {
                // Clear the selected wallet
                setSelectedWallet(null);
                // Navigate to splash screen with floating animations
                navigation.replace('Splash');
              } else {
                // If we deleted the currently selected wallet, select the first remaining wallet
                if (selectedWallet?.id === walletToDelete.id) {
                  setSelectedWallet(updatedWallets[0]);
                }
              }
              
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wallet');
            }
          }
        }
      ]
    );
  };

  const formatSats = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  // Update formatUSD function to use real BTC price
  const formatUSD = (sats: number) => {
    if (btcPrice.usd === 0) return '$0.00';
    const btcAmount = sats / 100000000;
    const usdAmount = btcAmount * btcPrice.usd;
    
    if (usdAmount < 0.01) {
      return '$0.00';
    } else if (usdAmount < 1) {
      return `$${usdAmount.toFixed(3)}`;
    } else if (usdAmount < 100) {
      return `$${usdAmount.toFixed(2)}`;
    } else {
      return `$${Math.round(usdAmount).toLocaleString()}`;
    }
  };

  // Add debug function to check wallet status
  const debugWalletStatus = async () => {
    console.log('=== WALLET DEBUG INFO ===');
    console.log('Current wallets in app:', wallets.map(w => ({ id: w.id, name: w.name })));
    console.log('Selected wallet:', selectedWallet ? { id: selectedWallet.id, name: selectedWallet.name } : 'None');
    
    // Test each wallet with the backend
    for (const wallet of wallets) {
      try {
        const response = await fetch(getApiUrl('/get-balance'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mnemonic: wallet.mnemonic }),
        });
        const data = await response.json();
        console.log(`Wallet ${wallet.name} (${wallet.id}):`, data.success ? 'VALID MNEMONIC' : data.error);
      } catch (error) {
        console.log(`Wallet ${wallet.name} (${wallet.id}): ERROR -`, error);
      }
    }
    console.log('=== END DEBUG INFO ===');
  };

  const startCardFloatingAnimation = () => {
    // Create smooth circular floating motion
    const createCircularFloatingSequence = () => {
      const radius = 6; // Circle radius in pixels
      const duration = 6000; // 6 seconds for full circle (faster)
      
      return Animated.loop(
        Animated.timing(new Animated.Value(0), {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Create animated value for the circular motion
    const circleProgress = new Animated.Value(0);
    
    // Start the circular animation
    Animated.loop(
      Animated.timing(circleProgress, {
        toValue: 1,
        duration: 6000, // 6 seconds for full circle (faster)
        useNativeDriver: true,
      })
    ).start();

    // Listen to the progress and update X,Y positions
    circleProgress.addListener(({ value }) => {
      const angle = value * 2 * Math.PI; // Convert to radians
      const radius = 6; // Circle radius
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      cardFloatX.setValue(x);
      cardFloatY.setValue(y);
    });
  };

  if (!selectedWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Welcome to Skibidi Wallet</Text>
          <Text style={styles.emptyStateText}>Create your first wallet to get started</Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, styles.createButton]} 
            onPress={() => navigation.navigate('CreateWallet')}
          >
            <LinearGradient
              colors={GRADIENTS.PRIMARY}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>Create Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, styles.restoreButton]} 
            onPress={restoreWallet}
          >
            <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      <Animated.ScrollView
        style={[styles.scrollContainer, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Wallet Selector */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.walletSelector}
              onPress={openWalletModal}
            >
              <Image 
                source={getWalletIcon(selectedWallet, 0)} 
                style={styles.walletSelectorIcon} 
              />
              <View style={styles.walletSelectorText}>
                <Text style={styles.walletName}>{selectedWallet.name}</Text>
                <Text style={styles.walletHint}>Tap to switch</Text>
              </View>
              <Text style={styles.dropdownIcon}>⌄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.walletMenuButton}
              onPress={navigateToBackup}
            >
              <Text style={styles.walletMenuIcon}>🔒</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* AMEX Card Image */}
        <Animated.View style={[
          styles.cardContainer, 
          { 
            transform: [
              { translateY: slideAnim },
              { scale: cardScaleAnim },
              { translateX: cardFloatX },
              { translateY: Animated.add(slideAnim, cardFloatY) }
            ],
            opacity: cardOpacityAnim
          }
        ]}>
          <Image
            source={getWalletCard(selectedWallet, 0)}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Balance Section - Cash App Style */}
        <Animated.View style={[styles.balanceContainer, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.balanceLabel}>Balance</Text>
          
          {isLoadingWalletData ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.mainBalance}>
                {formatUSD(balance.total)}
              </Text>
              
              <Text style={styles.btcBalance}>
                {formatSats(balance.total)} BTC
              </Text>
            </>
          )}
        </Animated.View>

        {/* Action Buttons - Cash App Style */}
        <Animated.View style={[styles.actionButtons, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity 
            style={[styles.actionButton, isAnimating && styles.actionButtonDisabled]} 
            onPress={navigateToSend}
            disabled={isAnimating}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonIcon}>↗</Text>
              <Text style={[styles.actionButtonText, isAnimating && styles.actionButtonTextDisabled]}>
                {isAnimating ? 'Sending...' : 'Send'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={navigateToReceive}>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonIcon}>↙</Text>
              <Text style={styles.actionButtonText}>Request</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Transaction History Link */}
        <Animated.View style={[styles.historyLinkContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity 
            style={styles.historyLink}
            onPress={() => navigation.navigate('Transactions', { walletId: selectedWallet.id, walletMnemonic: selectedWallet.mnemonic })}
          >
            <Text style={styles.historyLinkText}>View Transaction History</Text>
            <Text style={styles.historyLinkIcon}>→</Text>
          </TouchableOpacity>
        </Animated.View>


      </Animated.ScrollView>

      {/* Bottom Sheet Wallet Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="none"
        onRequestClose={closeWalletModal}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={closeWalletModal}
          />
          
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            {/* Handle */}
            <View style={styles.bottomSheetHandle} />
            
            {/* Title */}
            <Text style={styles.bottomSheetTitle}>Select Wallet</Text>
            
            {/* Wallet List */}
            <ScrollView style={styles.walletList} showsVerticalScrollIndicator={false}>
              {wallets.map((wallet, index) => (
                <TouchableOpacity
                  key={`${wallet.id}-${index}`}
                  style={[
                    styles.walletListItem,
                    selectedWallet?.id === wallet.id && styles.walletListItemSelected
                  ]}
                  onPress={() => selectWallet(wallet)}
                >
                  <Image source={getWalletIcon(wallet, 0)} style={styles.walletListIcon} />
                  <View style={styles.walletListDetails}>
                    <Text style={styles.walletListName}>{wallet.name}</Text>
                    <Text style={styles.walletListAddress}>
                      {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                    </Text>
                  </View>
                  {selectedWallet?.id === wallet.id && (
                    <Text style={styles.walletListCheckmark}>✓</Text>
                  )}
                  <TouchableOpacity
                    style={styles.walletListDelete}
                    onPress={() => deleteWallet(wallet)}
                  >
                    <Text style={styles.walletListDeleteText}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.bottomSheetActions}>
              <TouchableOpacity
                style={styles.bottomSheetActionButton}
                onPress={openCreateWalletModal}
              >
                <Text style={styles.bottomSheetActionIcon}>+</Text>
                <Text style={styles.bottomSheetActionText}>Create Wallet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bottomSheetActionButton}
                onPress={restoreWallet}
              >
                <Text style={styles.bottomSheetActionIcon}>↻</Text>
                <Text style={styles.bottomSheetActionText}>Restore Wallet</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XXL,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.MD,
    flex: 1,
  },
  walletSelectorIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.SM,
    marginRight: SPACING.SM,
  },
  walletSelectorText: {
    flex: 1,
  },
  walletName: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  walletHint: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
  },
  dropdownIcon: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  walletMenuButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.SM,
    marginLeft: SPACING.SM,
  },
  walletMenuIcon: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },

  // Card Container
  cardContainer: {
    marginHorizontal: 0,
    marginBottom: SPACING.LG,
    alignItems: 'center',
  },
  cardImage: {
    width: width,
    height: 200,
    borderRadius: 0,
  },

  // Balance Section - Cash App Style
  balanceContainer: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  mainBalance: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.BLACK,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -2,
    marginBottom: SPACING.XS,
  },
  btcBalance: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
  },

  // Action Buttons - Cash App Style
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.SM,
    alignItems: 'center',
  },
  actionButtonContent: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
    opacity: 0.6,
  },
  actionButtonTextDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },

  // History Link
  historyLinkContainer: {
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
    alignItems: 'center',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  historyLinkText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    marginRight: SPACING.XS,
  },
  historyLinkIcon: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },



  // Bottom Sheet Modal
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: RADIUS.XL,
    borderTopRightRadius: RADIUS.XL,
    paddingTop: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
    maxHeight: height * 0.8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.BORDER_LIGHT,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.LG,
  },
  bottomSheetTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  
  // Wallet List
  walletList: {
    maxHeight: height * 0.4,
    marginBottom: SPACING.LG,
  },
  walletListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.SURFACE_ELEVATED,
  },
  walletListItemSelected: {
    backgroundColor: COLORS.PRIMARY + '20',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  walletListIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.SM,
    marginRight: SPACING.MD,
  },
  walletListDetails: {
    flex: 1,
  },
  walletListName: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  walletListAddress: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  walletListCheckmark: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.BOLD,
    marginRight: SPACING.SM,
  },
  walletListDelete: {
    padding: SPACING.XS,
  },
  walletListDeleteText: {
    fontSize: 14,
  },

  // Bottom Sheet Actions
  bottomSheetActions: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  bottomSheetActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE_ELEVATED,
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  bottomSheetActionIcon: {
    fontSize: 16,
    marginRight: SPACING.XS,
    color: COLORS.TEXT_PRIMARY,
  },
  bottomSheetActionText: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  backupActionButton: {
    backgroundColor: COLORS.PRIMARY + '20',
    borderColor: COLORS.PRIMARY,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyStateTitle: {
    ...TEXT_STYLES.heading,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  emptyStateText: {
    ...TEXT_STYLES.bodySecondary,
    textAlign: 'center',
    marginBottom: SPACING.XXL,
  },
  primaryButton: {
    width: '100%',
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    marginBottom: SPACING.LG,
  },
  gradientButton: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_INVERSE,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  createButton: {
    ...SHADOWS.GLOW_GRAY,
  },
  restoreButton: {
    marginTop: SPACING.MD,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
}); 