import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WalletData } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS
} from '../theme';

type RestoreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Restore'>;

type Props = {
  navigation: RestoreScreenNavigationProp;
};

export default function RestoreScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [restoredWalletData, setRestoredWalletData] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const WALLETS_STORAGE_KEY = '@skibidi_wallets';

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const restoreWallet = async () => {
    if (!mnemonic.trim()) {
      Alert.alert('Required', 'Enter your seed phrase');
      return;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      Alert.alert('Invalid', 'Must be 12 words');
      return;
    }

    setRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.18.74:8080/restore-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: mnemonic.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setRestoredWalletData(result.data);
        setShowNameModal(true);
      } else {
        Alert.alert('Failed', 'Invalid seed phrase');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    } finally {
      setRestoring(false);
    }
  };

  const saveRestoredWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('Required', 'Enter wallet name');
      return;
    }

    try {
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      const existingWallets: WalletData[] = storedWallets ? JSON.parse(storedWallets) : [];

      const newWallet: WalletData = {
        id: restoredWalletData.wallet_id,
        name: walletName.trim(),
        address: restoredWalletData.address,
        mnemonic: restoredWalletData.mnemonic,
        balance: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedWallets = [...existingWallets, newWallet];
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(updatedWallets));

      setShowNameModal(false);
      setWalletName('');
      setMnemonic('');
      setRestoredWalletData(null);

      Alert.alert(
        'Restored',
        `Wallet "${walletName.trim()}" restored successfully`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('WalletManager'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not save wallet');
    }
  };

  const wordCount = mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restore Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Seed Phrase Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Seed Phrase</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your 12 words separated by spaces"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  value={mnemonic}
                  onChangeText={setMnemonic}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => navigation.navigate('QRScanner', {
                    onScan: (data: string) => setMnemonic(data)
                  })}
                >
                  <Text style={styles.scanButtonText}>📷</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.wordCount}>
                {wordCount}/12 words
              </Text>
            </View>

            {/* Restore Button */}
            <TouchableOpacity
              style={[
                styles.restoreButton,
                (wordCount === 12 && !restoring) && styles.restoreButtonActive
              ]}
              onPress={restoreWallet}
              disabled={wordCount !== 12 || restoring}
            >
              <Text style={styles.restoreButtonText}>
                {restoring ? 'Restoring...' : 'Restore Wallet'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Wallet</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Wallet name"
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={walletName}
              onChangeText={setWalletName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveRestoredWallet}
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
  
  flex: {
    flex: 1,
  },
  
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
    gap: SPACING.XL,
  },
  
  inputSection: {
    gap: SPACING.SM,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  textInput: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    marginRight: SPACING.SM,
  },
  
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scanButtonText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  
  wordCount: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'right',
  },
  
  restoreButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  
  restoreButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    opacity: 1,
    ...SHADOWS.SUBTLE,
  },
  
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
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
  
  modalInput: {
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
  
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 