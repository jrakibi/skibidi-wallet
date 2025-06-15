import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Clipboard,
  Animated,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS
} from '../theme';

type BackupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Backup'>;
type BackupScreenRouteProp = RouteProp<RootStackParamList, 'Backup'>;

type Props = {
  navigation: BackupScreenNavigationProp;
  route: BackupScreenRouteProp;
};

type BackupStep = 'reveal' | 'verify' | 'complete';

export default function BackupScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const words = mnemonic.split(' ');
  
  const [currentStep, setCurrentStep] = useState<BackupStep>('reveal');
  const [verificationWords, setVerificationWords] = useState<number[]>([]);
  const [selectedWords, setSelectedWords] = useState<{[key: number]: string}>({});
  const [showWords, setShowWords] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Generate 3 random word positions for verification
    const positions: number[] = [];
    while (positions.length < 3) {
      const pos = Math.floor(Math.random() * 12);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    setVerificationWords(positions.sort());

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const revealWords = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowWords(true);
  };

  const proceedToVerify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep('verify');
  };

  const selectVerificationWord = (position: number, word: string) => {
    setSelectedWords({...selectedWords, [position]: word});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const verifyAndComplete = () => {
    const isCorrect = verificationWords.every(pos => selectedWords[pos] === words[pos]);
    
    if (isCorrect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setCurrentStep('complete');
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert('Try Again', 'Check your words');
      setSelectedWords({});
    }
  };

  const copySeedPhrase = () => {
    Clipboard.setString(mnemonic);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Copied', 'Seed phrase copied');
  };

  const finishBackup = () => {
    navigation.goBack();
  };

  const renderRevealStep = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seed Phrase</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>⚠️ Write these words down safely</Text>
        </View>

        <View style={styles.seedCard}>
          {!showWords ? (
            <View style={styles.hiddenContainer}>
              <Text style={styles.hiddenEmoji}>🔒</Text>
              <Text style={styles.hiddenText}>Tap to reveal</Text>
              <TouchableOpacity style={styles.revealButton} onPress={revealWords}>
                <Text style={styles.revealButtonText}>Show Words</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.wordsContainer}>
              <View style={styles.wordsGrid}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordCard}>
                    <Text style={styles.wordNumber}>{index + 1}</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.copyButton} onPress={copySeedPhrase}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={proceedToVerify}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderVerifyStep = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('reveal')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.verifyText}>Select the correct words:</Text>
        
        {verificationWords.map((position) => (
          <View key={position} style={styles.verifySection}>
            <Text style={styles.verifyLabel}>Word #{position + 1}</Text>
            <View style={styles.wordOptions}>
              {[words[position], ...words.filter((_, i) => i !== position).slice(0, 2)]
                .sort(() => Math.random() - 0.5)
                .map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedWords[position] === option && styles.selectedOption
                    ]}
                    onPress={() => selectVerificationWord(position, option)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedWords[position] === option && styles.selectedOptionText
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            verificationWords.every(pos => selectedWords[pos]) && styles.verifyButtonActive
          ]}
          onPress={verifyAndComplete}
          disabled={!verificationWords.every(pos => selectedWords[pos])}
        >
          <Text style={styles.verifyButtonText}>Verify</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  const renderCompleteStep = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>✅</Text>
        <Text style={styles.completeTitle}>Backup Complete</Text>
        <Text style={styles.completeText}>Your wallet is now secure</Text>
        
        <TouchableOpacity style={styles.doneButton} onPress={finishBackup}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'reveal':
        return renderRevealStep();
      case 'verify':
        return renderVerifyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderRevealStep();
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      {renderCurrentStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  container: {
    flex: 1,
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
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },
  
  warningCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.WARNING,
  },
  
  warningText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  
  seedCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  
  hiddenContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  
  hiddenEmoji: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },
  
  hiddenText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  
  revealButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  wordsContainer: {
    gap: SPACING.LG,
  },
  
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  
  wordCard: {
    width: '30%',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.SM,
    padding: SPACING.SM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  wordNumber: {
    fontSize: 10,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: 2,
  },
  
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  
  copyButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  verifyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  
  verifySection: {
    marginBottom: SPACING.LG,
  },
  
  verifyLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  
  wordOptions: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  
  optionButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
    padding: SPACING.SM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  selectedOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  
  optionText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  
  selectedOptionText: {
    fontWeight: '600',
  },
  
  verifyButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.LG,
    opacity: 0.5,
  },
  
  verifyButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    opacity: 1,
  },
  
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  
  completeEmoji: {
    fontSize: 64,
    marginBottom: SPACING.LG,
  },
  
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  completeText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XL,
  },
  
  doneButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    paddingHorizontal: SPACING.XL,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 