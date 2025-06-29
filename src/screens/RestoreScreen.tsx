import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WalletData } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  TYPOGRAPHY,
  GRADIENTS
} from '../theme';
import { getApiUrl, BITCOIN_NETWORK } from '../config';
import GameifiedSeedInput from '../components/GameifiedSeedInput';

const { width, height } = Dimensions.get('window');

type RestoreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Restore'>;

type Props = {
  navigation: RestoreScreenNavigationProp;
};

type Step = 'input' | 'restoring' | 'customize' | 'success';

const WALLETS_STORAGE_KEY = '@skibidi_wallets';

// Available wallet icons
const WALLET_ICONS = [
  require('../../assets/brainrot/brainrot1.png'),
  require('../../assets/brainrot/brainrot2.png'),
  require('../../assets/brainrot/brainrot3.png'),
  require('../../assets/brainrot/brainrot4.png'),
  require('../../assets/brainrot/brainrot5.png'),
  require('../../assets/brainrot/brainrot6.png'),
];

// Brainrot names corresponding to each icon
const BRAINROT_NAMES = [
  'Tung Tung Sahur',      // brainrot1
  'Tung Sahur',           // brainrot2  
  'Ballerina Cappuccina', // brainrot3
  'Bombardiro Crocodilo', // brainrot4
  'Tralalero Tralala',    // brainrot5
  'Skibidi',              // brainrot6
];

export default function RestoreScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [mnemonic, setMnemonic] = useState('');
  const [walletName, setWalletName] = useState('');
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [restoredWalletData, setRestoredWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isGameified, setIsGameified] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [progressAnim] = useState(new Animated.Value(0));

  // Initialize with the first brainrot name when we reach customize step
  useEffect(() => {
    if (currentStep === 'customize' && !walletName) {
      generateUniqueWalletName(0);
    }
  }, [currentStep]);

  // Function to generate a unique wallet name based on brainrot selection
  const generateUniqueWalletName = async (iconIndex: number) => {
    try {
      const existingWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      const wallets = existingWallets ? JSON.parse(existingWallets) : [];
      
      const baseName = BRAINROT_NAMES[iconIndex % BRAINROT_NAMES.length];
      
      // Check if the base name already exists
      const existingNames = wallets.map((w: WalletData) => w.name);
      
      if (!existingNames.includes(baseName)) {
        setWalletName(baseName);
        return;
      }
      
      // Find the next available number
      let counter = 2;
      let uniqueName = `${baseName} ${counter}`;
      
      while (existingNames.includes(uniqueName)) {
        counter++;
        uniqueName = `${baseName} ${counter}`;
      }
      
      setWalletName(uniqueName);
    } catch (error) {
      // Fallback to base name if there's an error
      setWalletName(BRAINROT_NAMES[iconIndex % BRAINROT_NAMES.length]);
    }
  };

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.MEDIUM,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.MEDIUM,
        useNativeDriver: true,
      }),
    ]).start();

    // Update progress animation
    const stepProgress = {
      input: 0.25,
      restoring: 0.5,
      customize: 0.75,
      success: 1.0,
    };

    Animated.timing(progressAnim, {
      toValue: stepProgress[currentStep],
      duration: ANIMATIONS.FAST,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const wordCount = mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0;

  const handleNext = async () => {
    switch (currentStep) {
      case 'input':
        if (wordCount !== 12) {
          Alert.alert('Invalid Seed Phrase', 'Please enter exactly 12 words');
          return;
        }
        setCurrentStep('restoring');
        await restoreWallet();
        break;
      case 'restoring':
        setCurrentStep('customize');
        break;
      case 'customize':
        if (!walletName.trim()) {
          Alert.alert('Name Required', 'Please enter a wallet name');
          return;
        }
        await saveRestoredWallet();
        setCurrentStep('success');
        break;
      case 'success':
        navigation.navigate('MainTabs');
        break;
    }
  };

  const restoreWallet = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(getApiUrl('/restore-wallet'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mnemonic: mnemonic.trim(),
          network: BITCOIN_NETWORK, // Specify mainnet instead of testnet
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRestoredWalletData(result.data);
        setTimeout(() => {
          setCurrentStep('customize');
        }, 1500);
      } else {
        Alert.alert('Invalid Seed Phrase', 'Please check your seed phrase and try again');
        setCurrentStep('input');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your connection and try again');
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  const saveRestoredWallet = async () => {
    if (!restoredWalletData) return;

    try {
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      const existingWallets: WalletData[] = storedWallets ? JSON.parse(storedWallets) : [];

      // Check if wallet with same ID already exists
      const existingWallet = existingWallets.find(w => w.id === restoredWalletData.wallet_id);
      if (existingWallet) {
        Alert.alert(
          'Wallet Already Exists',
          `A wallet with this seed phrase already exists: "${existingWallet.name}". Each seed phrase can only be used once.`,
          [{ text: 'OK', onPress: () => setCurrentStep('input') }]
        );
        return;
      }

      const newWallet: WalletData = {
        id: restoredWalletData.wallet_id,
        name: walletName.trim(),
        address: restoredWalletData.address,
        mnemonic: restoredWalletData.mnemonic,
        balance: 0,
        createdAt: new Date().toISOString(),
        iconIndex: selectedIconIndex,
      };

      const updatedWallets = [...existingWallets, newWallet];
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(updatedWallets));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Could not save wallet');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.headerSection}>
              <Image 
                source={require('../../assets/icons/locker.png')} 
                style={styles.headerIconCompact}
              />
              <Text style={styles.stepTitleCompact}>Restore Your Wallet</Text>
              <Text style={styles.stepDescriptionCompact}>
                Enter your 12-word recovery phrase to restore your Bitcoin wallet
              </Text>
              
              {/* Mode Toggle */}
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    !isGameified && styles.modeToggleButtonActive
                  ]}
                  onPress={() => {
                    setIsGameified(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.modeToggleText,
                    !isGameified && styles.modeToggleTextActive
                  ]}>
                    Classic Mode
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    isGameified && styles.modeToggleButtonActive
                  ]}
                  onPress={() => {
                    setIsGameified(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.modeToggleText,
                    isGameified && styles.modeToggleTextActive
                  ]}>
                    🎮 Build Skibidi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {isGameified ? (
              <GameifiedSeedInput
                mnemonic={mnemonic}
                onMnemonicChange={setMnemonic}
                wordCount={wordCount}
              />
            ) : (
              <View style={styles.inputSectionCompact}>
                <Text style={styles.inputLabelCompact}>Recovery Phrase</Text>
                <TextInput
                  style={styles.textInputClassic}
                  placeholder="Enter your 12 words separated by spaces"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  value={mnemonic}
                  onChangeText={setMnemonic}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <View style={styles.wordCountContainer}>
                  <Text style={[
                    styles.wordCount,
                    wordCount === 12 ? styles.wordCountValid : styles.wordCountInvalid
                  ]}>
                    {wordCount}/12 words
                  </Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'restoring':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.loadingContainer}>
              <Image 
                source={require('../../assets/icons/locker.png')} 
                style={styles.loadingIcon}
              />
              <Text style={styles.stepTitle}>Restoring Wallet</Text>
              <Text style={styles.stepDescription}>
                Validating your recovery phrase and restoring your wallet...
              </Text>
            </View>
          </View>
        );

      case 'customize':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.stepTitle}>Customize Your Wallet</Text>
              <Text style={styles.stepDescription}>
                Choose a name and icon for your restored wallet
              </Text>
            </View>

            {/* Icon Selection */}
            <View style={styles.iconSelectionContainer}>
              <Text style={styles.sectionLabel}>Choose Icon</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.iconScrollView}
                contentContainerStyle={styles.iconScrollContent}
              >
                {WALLET_ICONS.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconOption,
                      selectedIconIndex === index && styles.iconOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedIconIndex(index);
                      generateUniqueWalletName(index);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Image source={icon} style={styles.iconOptionImage} />
                    {selectedIconIndex === index && (
                      <View style={styles.iconSelectedOverlay}>
                        <Text style={styles.iconSelectedCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Wallet Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="My Restored Wallet"
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                value={walletName}
                onChangeText={setWalletName}
                maxLength={20}
                autoFocus
              />
            </View>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.successContainer}>
              <Image source={WALLET_ICONS[selectedIconIndex]} style={styles.successIcon} />
              <Text style={styles.stepTitle}>Wallet Restored!</Text>
              <Text style={styles.stepDescription}>
                Your wallet "{walletName}" has been successfully restored
              </Text>
              
              <View style={styles.walletInfoCard}>
                <Text style={styles.walletInfoLabel}>Address</Text>
                <Text style={styles.walletInfoValue} numberOfLines={1} ellipsizeMode="middle">
                  {restoredWalletData?.address}
                </Text>
              </View>
            </View>
          </View>
        );
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 'input': return 'Restore Wallet';
      case 'restoring': return 'Restoring...';
      case 'customize': return 'Save Wallet';
      case 'success': return 'Go to Wallet';
      default: return 'Next';
    }
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case 'input': return wordCount !== 12;
      case 'restoring': return loading;
      case 'customize': return !walletName.trim();
      default: return false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Step Content */}
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {renderStepContent()}
          </ScrollView>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isButtonDisabled() && styles.actionButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isButtonDisabled()}
          >
            <LinearGradient
              colors={isButtonDisabled() ? [COLORS.SURFACE, COLORS.SURFACE] : GRADIENTS.PRIMARY}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[
                styles.actionButtonText,
                isButtonDisabled() && styles.actionButtonTextDisabled,
              ]}>
                {getButtonText()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  keyboardAvoidingView: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.LG,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  placeholder: {
    width: 40,
  },
  
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
    marginBottom: SPACING.LG,
  },
  
  progressTrack: {
    height: '100%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.SM,
  },
  
  scrollView: {
    flex: 1,
  },
  
  stepContainer: {
    flex: 1,
    paddingVertical: SPACING.MD,
  },
  
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  
  headerIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.LG,
  },
  
  stepTitle: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  
  stepDescription: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  inputSection: {
    marginBottom: SPACING.XL,
  },
  
  inputLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  
  wordCountContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.SM,
  },
  
  wordCount: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  
  wordCountValid: {
    color: COLORS.SUCCESS,
  },
  
  wordCountInvalid: {
    color: COLORS.TEXT_TERTIARY,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.LG,
  },
  
  iconSelectionContainer: {
    marginBottom: SPACING.XL,
  },
  
  sectionLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  iconScrollView: {
    height: 80,
  },
  
  iconScrollContent: {
    paddingHorizontal: SPACING.SM,
    gap: SPACING.SM,
  },
  
  iconOption: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.SURFACE,
    marginRight: SPACING.SM,
    position: 'relative',
    ...SHADOWS.SUBTLE,
  },
  
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    ...SHADOWS.GLOW_GRAY,
  },
  
  iconOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.MD,
  },
  
  iconSelectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconSelectedCheck: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  
  nameInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.LG,
    marginBottom: SPACING.LG,
  },
  
  walletInfoCard: {
    width: '100%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginTop: SPACING.XL,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  
  walletInfoLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  
  walletInfoValue: {
    fontSize: TYPOGRAPHY.BODY,
    fontFamily: 'Courier',
    color: COLORS.TEXT_PRIMARY,
  },
  
  buttonContainer: {
    paddingVertical: SPACING.LG,
  },
  
  actionButton: {
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    ...SHADOWS.SUBTLE,
  },
  
  actionButtonDisabled: {
    opacity: 0.5,
  },
  
  buttonGradient: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  
  actionButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  actionButtonTextDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },

  // Mode Toggle Styles
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.XS,
    marginTop: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },

  modeToggleButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.SM,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeToggleButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    ...SHADOWS.GLOW_GRAY,
  },

  modeToggleText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },

  modeToggleTextActive: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },

  // Compact styles for better fit
  headerIconCompact: {
    width: 40,
    height: 40,
    marginBottom: SPACING.SM,
  },

  stepTitleCompact: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },

  stepDescriptionCompact: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },

  inputSectionCompact: {
    marginBottom: SPACING.MD,
  },

  inputLabelCompact: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },

  textInputClassic: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
}); 