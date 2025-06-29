import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
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
  BUTTON_STYLES,
  CARD_STYLES,
  GRADIENTS
} from '../theme';
import { getApiUrl, BITCOIN_NETWORK } from '../config';

const { width, height } = Dimensions.get('window');

type CreateWalletScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateWallet'
>;

type Props = {
  navigation: CreateWalletScreenNavigationProp;
};

type Step = 'name' | 'generating' | 'backup' | 'seedReview' | 'complete';

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

export default function CreateWalletScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [walletName, setWalletName] = useState('');
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [generatedWallet, setGeneratedWallet] = useState<any>(null);
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [progressAnim] = useState(new Animated.Value(0));

  // Initialize with the first brainrot name on component mount
  useEffect(() => {
    generateUniqueWalletName(0);
  }, []);

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
      name: 0.2,
      generating: 0.4,
      backup: 0.6,
      seedReview: 0.8,
      complete: 1.0,
    };

    Animated.timing(progressAnim, {
      toValue: stepProgress[currentStep],
      duration: ANIMATIONS.FAST,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = async () => {
    switch (currentStep) {
      case 'name':
        if (!walletName.trim()) {
          Alert.alert('Name Required', 'Please enter a wallet name');
          return;
        }
        setCurrentStep('generating');
        await generateWallet();
        break;
      case 'generating':
        setCurrentStep('backup');
        break;
      case 'backup':
        // This step now just shows the two options, they handle navigation themselves
        break;
      case 'seedReview':
        setCurrentStep('complete');
        break;
      case 'complete':
        await saveWallet();
        break;
    }
  };

  const generateWallet = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(getApiUrl('/create-wallet'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: BITCOIN_NETWORK, // Specify mainnet instead of testnet
        }),
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedWallet(data.data);
        setSeedWords(data.data.mnemonic.split(' '));
        setTimeout(() => {
          setCurrentStep('backup');
        }, 1500);
      } else {
        Alert.alert('Error', 'Failed to generate wallet');
        setCurrentStep('name');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      setCurrentStep('name');
    } finally {
      setLoading(false);
    }
  };

  const saveWallet = async () => {
    if (!generatedWallet) return;

    try {
      const existingWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      const wallets = existingWallets ? JSON.parse(existingWallets) : [];

      // Check if wallet with same ID already exists
      const existingWallet = wallets.find((w: WalletData) => w.id === generatedWallet.wallet_id);
      if (existingWallet) {
        // Debug: Show all existing wallets
        console.log('=== DEBUGGING WALLET COLLISION ===');
        console.log('Existing wallets in storage:');
        wallets.forEach((wallet: WalletData, index: number) => {
          console.log(`Wallet ${index + 1}:`);
          console.log(`  Name: ${wallet.name}`);
          console.log(`  ID: ${wallet.id}`);
          console.log(`  Address: ${wallet.address}`);
          console.log(`  Created: ${wallet.createdAt}`);
        });
        console.log(`New wallet trying to be created:`);
        console.log(`  ID: ${generatedWallet.wallet_id}`);
        console.log(`  Address: ${generatedWallet.address}`);
        console.log('=== END DEBUG INFO ===');

        Alert.alert(
          'Wallet Already Exists',
          `A wallet with this seed phrase already exists: "${existingWallet.name}". Each seed phrase can only be used once.

Existing wallets:
${wallets.map((w: WalletData, i: number) => `${i + 1}. ${w.name}`).join('\n')}

Would you like to delete existing wallets or try creating with a different approach?`,
          [
            { text: 'Cancel', onPress: () => setCurrentStep('name') },
            { 
              text: 'Clear All Wallets', 
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.removeItem(WALLETS_STORAGE_KEY);
                Alert.alert('Cleared', 'All wallets have been cleared. Try creating again.');
                setCurrentStep('name');
              }
            }
          ]
        );
        return;
      }

      const newWallet: WalletData = {
        id: generatedWallet.wallet_id,
        name: walletName.trim(),
        address: generatedWallet.address,
        mnemonic: generatedWallet.mnemonic,
        balance: 0,
        createdAt: new Date().toISOString(),
        iconIndex: selectedIconIndex, // Add icon index to wallet data
      };

      wallets.push(newWallet);
      
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        // Navigate to MainTabs (which contains HomeTab)
        navigation.navigate('MainTabs');
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to save wallet');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Customize Your Wallet</Text>
            <Text style={styles.stepDescription}>
              Choose a name and icon for your wallet
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
                placeholder="My Skibidi Wallet"
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                value={walletName}
                onChangeText={setWalletName}
                maxLength={20}
                autoFocus
              />
            </View>
          </View>
        );

      case 'generating':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.loadingContainer}>
              <Image source={WALLET_ICONS[selectedIconIndex]} style={styles.generatingIcon} />
              <Text style={styles.stepTitle}>Generating Wallet</Text>
              <Text style={styles.stepDescription}>
                Creating your secure Bitcoin wallet...
              </Text>
            </View>
          </View>
        );

      case 'backup':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.warningContainer}>
              <Text style={styles.stepTitle}>🎯 Learn Your Seed Phrase</Text>
              <Text style={styles.stepDescription}>
                Your seed phrase is 12 special words that restore your wallet. Choose how you'd like to learn them:
              </Text>
            </View>

            {/* Options Row */}
            <View style={styles.optionsRow}>
              {/* Game Option */}
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  navigation.navigate('SeedGame', {
                    seedWords,
                    onComplete: (words: string[]) => {
                      // Game completed, proceed to seed review step
                      setCurrentStep('seedReview');
                    }
                  });
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4']}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <Image 
                      source={require('../../assets/brainrot/brainrot4.png')} 
                      style={[styles.optionIcon, { transform: [{ scaleX: -1 }] }]}
                    />
                    <Text style={styles.optionBadge}>FUN</Text>
                  </View>
                  <Text style={styles.optionTitle}>Game Mode</Text>
                  <Text style={styles.optionDesc}>
                    Interactive
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Traditional Option */}
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => setCurrentStep('seedReview')}
              >
                <View style={styles.optionBackground}>
                  <View style={styles.optionIconContainer}>
                    <Image 
                      source={require('../../assets/icons/locker.png')} 
                      style={styles.optionIcon}
                    />
                    <Text style={styles.optionBadgeClassic}>CLASSIC</Text>
                  </View>
                  <Text style={styles.optionTitle}>Classic View</Text>
                  <Text style={styles.optionDesc}>
                    Simple list
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.helpText}>
              <Text style={styles.helpTextContent}>
                💡 Both options show the same secure seed phrase - just choose your preferred learning style!
              </Text>
            </View>
          </View>
        );

      case 'seedReview':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.warningContainer}>
              <Text style={styles.stepTitle}>🔐 Your Seed Phrase</Text>
              <Text style={styles.stepDescription}>
                Write down these 12 words in order. This is the only way to recover your wallet if you lose access.
              </Text>
            </View>

            <View style={styles.seedGrid}>
              {seedWords.map((word, index) => (
                <View key={index} style={styles.seedWordContainer}>
                  <Text style={styles.seedWordNumber}>{index + 1}</Text>
                  <Text style={styles.seedWord}>{word}</Text>
                </View>
              ))}
            </View>

            <View style={styles.backupTips}>
              <Text style={styles.backupTipsTitle}>⚠️ Important:</Text>
              <Text style={styles.backupTip}>• Write these words on paper</Text>
              <Text style={styles.backupTip}>• Store in a safe place</Text>
              <Text style={styles.backupTip}>• Never share with anyone</Text>
              <Text style={styles.backupTip}>• Anyone with these words can access your funds</Text>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.successContainer}>
              <Image source={WALLET_ICONS[selectedIconIndex]} style={styles.successIcon} />
              <Text style={styles.stepTitle}>Wallet Created!</Text>
              <Text style={styles.stepDescription}>
                Your wallet "{walletName}" is ready to use
              </Text>
              
              <View style={styles.walletInfoCard}>
                <Text style={styles.walletInfoLabel}>Address</Text>
                <Text style={styles.walletInfoValue} numberOfLines={1} ellipsizeMode="middle">
                  {generatedWallet?.address}
                </Text>
              </View>
            </View>
          </View>
        );
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 'name': return 'Create Wallet';
      case 'generating': return 'Generating...';
      case 'backup': return 'Choose Learning Style';
      case 'seedReview': return 'I\'ve Saved My Seed Phrase';
      case 'complete': return 'Start Using Wallet';
      default: return 'Next';
    }
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case 'name': return !walletName.trim();
      case 'generating': return loading;
      case 'backup': return true; // Disabled because navigation is handled by option buttons
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
          
          <Text style={styles.headerTitle}>Create Wallet</Text>
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
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.LG,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 20,
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
    marginBottom: SPACING.XL,
  },
  
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  
  scrollView: {
    flex: 1,
  },
  
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  
  stepTitle: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  
  stepDescription: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    lineHeight: 24,
  },

  // Icon Selection Styles
  iconSelectionContainer: {
    width: '100%',
    marginBottom: SPACING.XL,
  },

  iconSelectionLabel: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },

  iconScrollView: {
    maxHeight: 100,
  },

  iconScrollContent: {
    paddingHorizontal: SPACING.SM,
    alignItems: 'center',
  },

  iconOption: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.LG,
    marginHorizontal: SPACING.XS,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    position: 'relative',
  },

  iconOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '20',
  },

  iconOptionImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.MD,
  },

  iconSelectedOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconSelectedCheck: {
    fontSize: 12,
    color: COLORS.TEXT_INVERSE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.XL,
  },

  inputLabel: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  loadingContainer: {
    alignItems: 'center',
  },

  generatingIcon: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.LG,
    marginBottom: SPACING.LG,
  },
  
  warningContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  
  warningIcon: {
    width: 50,
    height: 50,
    marginBottom: SPACING.MD,
  },
  
  warningText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.WARNING,
    textAlign: 'center',
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.LG,
    borderRadius: RADIUS.MD,
    marginTop: SPACING.MD,
  },
  
  seedContainer: {
    width: '100%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    borderWidth: 2,
    borderColor: COLORS.BORDER_MEDIUM,
    marginBottom: SPACING.LG,
  },
  
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  seedWordContainer: {
    width: '30%',
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    alignItems: 'center',
  },
  
  seedWordNumber: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: SPACING.XS,
  },
  
  seedWord: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  
  tapToView: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.MD,
  },

  backupTips: {
    width: '100%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },

  backupTipsTitle: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },

  backupTip: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
    paddingLeft: SPACING.SM,
  },
  
  successContainer: {
    alignItems: 'center',
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    width: '100%',
    maxHeight: '80%',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  
  modalTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalCloseText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
  },
  
  modalSeedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.XL,
  },
  
  modalSeedWord: {
    width: '30%',
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    alignItems: 'center',
  },
  
  modalSeedNumber: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: SPACING.XS,
  },
  
  modalSeedText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  
  modalWarning: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.WARNING,
    textAlign: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.LG,
    borderRadius: RADIUS.MD,
  },
  
  // Game option styles
  gameOptionContainer: {
    marginBottom: SPACING.LG,
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    ...SHADOWS.SUBTLE,
  },
  
  gameOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  
  gameOptionIcon: {
    width: 60,
    height: 60,
    marginRight: SPACING.MD,
  },
  
  gameOptionContent: {
    flex: 1,
  },
  
  gameOptionTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  gameOptionDesc: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.9,
  },
  
  gameOptionArrow: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  
  // Traditional option styles
  traditionalOptionContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    marginBottom: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  
  traditionalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  
  traditionalIcon: {
    width: 40,
    height: 40,
    marginRight: SPACING.MD,
  },
  
  traditionalContent: {
    flex: 1,
  },
  
  traditionalTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  traditionalDesc: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
  },
  
  // New improved styles
  optionIconContainer: {
    alignItems: 'center',
    marginRight: SPACING.MD,
    position: 'relative',
  },
  
  optionBadge: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: RADIUS.XS,
    marginTop: SPACING.XS,
    textAlign: 'center',
  },
  
  optionBadgeClassic: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: RADIUS.XS,
    marginTop: SPACING.XS,
    textAlign: 'center',
  },
  
  gameOptionFeature: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    marginTop: SPACING.XS,
  },
  
  traditionalFeature: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginTop: SPACING.XS,
  },
  
  traditionalArrow: {
    fontSize: 20,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  
  helpText: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginVertical: SPACING.SM,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  
  helpTextContent: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // New compact option styles
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  
  optionCard: {
    flex: 1,
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    ...SHADOWS.SUBTLE,
  },
  
  optionGradient: {
    padding: SPACING.XL,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  
  optionBackground: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.XL,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  
  optionIcon: {
    width: 50,
    height: 50,
    marginBottom: SPACING.SM,
  },
  
  optionTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  
  optionDesc: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
}); 