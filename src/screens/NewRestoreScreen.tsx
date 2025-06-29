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

const { width, height } = Dimensions.get('window');

type RestoreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Restore'>;

type Props = {
  navigation: RestoreScreenNavigationProp;
};

type Step = 'intro' | 'input' | 'validating' | 'customize' | 'success';

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
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [walletName, setWalletName] = useState('');
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [restoredWalletData, setRestoredWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
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

    // Update progress animation based on step
    const stepProgress = {
      intro: 0.2,
      input: 0.4,
      validating: 0.6,
      customize: 0.8,
      success: 1.0,
    };

    Animated.timing(progressAnim, {
      toValue: stepProgress[currentStep],
      duration: ANIMATIONS.FAST,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = async () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('input');
        break;
      case 'input':
        if (seedWords.every(word => word.trim())) {
          setCurrentStep('validating');
          await validateSeedPhrase();
        } else {
          Alert.alert('Incomplete', 'Please fill in all 12 seed words');
        }
        break;
      case 'validating':
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

  const validateSeedPhrase = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const mnemonic = seedWords.join(' ');
      const response = await fetch(getApiUrl('/restore-wallet'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mnemonic,
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
        Alert.alert('Invalid Seed Phrase', 'Please check your words and try again');
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

  const updateSeedWord = (index: number, word: string) => {
    const newSeedWords = [...seedWords];
    newSeedWords[index] = word.toLowerCase().trim();
    setSeedWords(newSeedWords);
    
    // Auto-focus next input if current word is complete
    if (word.trim() && index < 11) {
      setActiveWordIndex(index + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.introContainer}>
              <Image 
                source={require('../../assets/icons/locker.png')} 
                style={styles.introIcon}
              />
              <Text style={styles.stepTitle}>Restore Your Wallet</Text>
              <Text style={styles.stepDescription}>
                Enter your 12-word recovery phrase to restore your Bitcoin wallet
              </Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureText}>Secure restoration process</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureText}>Instant wallet access</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>💎</Text>
                  <Text style={styles.featureText}>Full balance recovery</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'input':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Enter Seed Phrase</Text>
            <Text style={styles.stepDescription}>
              Type each word of your 12-word recovery phrase
            </Text>
            
            <View style={styles.seedInputContainer}>
              {seedWords.map((word, index) => (
                <View key={index} style={styles.seedWordInputContainer}>
                  <Text style={styles.seedWordNumber}>{index + 1}</Text>
                  <TextInput
                    style={[
                      styles.seedWordInput,
                      activeWordIndex === index && styles.seedWordInputActive
                    ]}
                    value={word}
                    onChangeText={(text) => updateSeedWord(index, text)}
                    onFocus={() => setActiveWordIndex(index)}
                    placeholder="word"
                    placeholderTextColor={COLORS.TEXT_TERTIARY}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>
              ))}
            </View>
            
            <Text style={styles.progressText}>
              {seedWords.filter(w => w.trim()).length}/12 words entered
            </Text>
          </View>
        );

      case 'validating':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.loadingContainer}>
              <Image 
                source={require('../../assets/icons/locker.png')} 
                style={styles.validatingIcon}
              />
              <Text style={styles.stepTitle}>Validating Seed Phrase</Text>
              <Text style={styles.stepDescription}>
                Checking your recovery phrase and restoring wallet...
              </Text>
            </View>
          </View>
        );

      case 'customize':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Customize Your Wallet</Text>
            <Text style={styles.stepDescription}>
              Choose a name and icon for your restored wallet
            </Text>
            
            {/* Icon Selection */}
            <View style={styles.iconSelectionContainer}>
              <Text style={styles.iconSelectionLabel}>Choose Icon</Text>
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Wallet Name</Text>
              <TextInput
                style={styles.textInput}
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
      case 'intro': return 'Start Restoration';
      case 'input': return 'Validate Seed Phrase';
      case 'validating': return 'Validating...';
      case 'customize': return 'Restore Wallet';
      case 'success': return 'Go to Wallet';
      default: return 'Next';
    }
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case 'input': return !seedWords.every(word => word.trim());
      case 'validating': return loading;
      case 'customize': return !walletName.trim();
      default: return false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
    paddingHorizontal: SPACING.LG,
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
    paddingVertical: SPACING.LG,
  },
  
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  introIcon: {
    width: 80,
    height: 80,
    marginBottom: SPACING.LG,
  },
  
  stepTitle: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  
  stepDescription: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  
  featureList: {
    alignItems: 'center',
    gap: SPACING.LG,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  
  featureIcon: {
    fontSize: 24,
  },
  
  featureText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
  },
  
  seedInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  
  seedWordInputContainer: {
    width: '30%',
    marginBottom: SPACING.MD,
  },
  
  seedWordNumber: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  
  seedWordInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  seedWordInputActive: {
    borderColor: COLORS.PRIMARY,
    ...SHADOWS.GLOW_GRAY,
  },
  
  progressText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  validatingIcon: {
    width: 80,
    height: 80,
    marginBottom: SPACING.LG,
  },
  
  iconSelectionContainer: {
    marginBottom: SPACING.XL,
  },
  
  iconSelectionLabel: {
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
  
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  
  inputLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
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
}); 