import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, WalletData } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS
} from '../theme';

type WalletManagerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'WalletManager'
>;

type Props = {
  navigation: WalletManagerScreenNavigationProp;
};

const WALLETS_STORAGE_KEY = '@skibidi_wallets';

export default function WalletManagerScreen({ navigation }: Props) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadWallets();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      
      if (storedWallets) {
        const parsedWallets = JSON.parse(storedWallets);
        setWallets(parsedWallets);
      } else {
        setWallets([]);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      Alert.alert('Error', 'Could not load wallets');
    } finally {
      setLoading(false);
    }
  };

  const saveWallets = async (walletsToSave: WalletData[]) => {
    try {
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(walletsToSave));
      setWallets(walletsToSave);
    } catch (error) {
      Alert.alert('Error', 'Could not save wallets');
    }
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
        await saveWallets(updatedWallets);
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

  const selectWallet = (wallet: WalletData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Wallet', { walletData: wallet });
  };

  const deleteWallet = (walletId: string, walletName: string) => {
    Alert.alert(
      'Delete Wallet?',
      `Delete "${walletName}"? Make sure you have your seed phrase!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWallets = wallets.filter(w => w.id !== walletId);
            await saveWallets(updatedWallets);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const restoreWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Restore');
  };

  const navigateToEducation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Education');
  };

  useFocusEffect(
    React.useCallback(() => {
      loadWallets();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallets</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Wallets List */}
          {wallets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💎</Text>
              <Text style={styles.emptyTitle}>No wallets yet</Text>
              <Text style={styles.emptyText}>Create your first wallet</Text>
            </View>
          ) : (
            <View style={styles.walletsList}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={styles.walletCard}
                  onPress={() => selectWallet(wallet)}
                  onLongPress={() => deleteWallet(wallet.id, wallet.name)}
                >
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletAddress}>
                      {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteWallet(wallet.id, wallet.name)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
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

            <TouchableOpacity
              style={styles.educationButton}
              onPress={navigateToEducation}
            >
              <Text style={styles.educationButtonText}>🎓 Learn Bitcoin</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

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
              >
                <Text style={styles.createButtonText}>Create</Text>
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
  
  content: {
    flex: 1,
  },
  
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: 60,
    paddingBottom: SPACING.LG,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  
  emptyEmoji: {
    fontSize: 48,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  
  walletsList: {
    gap: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  
  walletCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  
  walletInfo: {
    flex: 1,
    gap: SPACING.XS,
  },
  
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  walletAddress: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  
  walletArrow: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  actionsContainer: {
    gap: SPACING.MD,
    paddingBottom: SPACING.XL,
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
  
  educationButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  
  educationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
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
  
  deleteButton: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    padding: SPACING.XS,
  },
  
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 