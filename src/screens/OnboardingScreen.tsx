import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS
} from '../theme';

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

type Props = {
  navigation: OnboardingScreenNavigationProp;
};

const { height } = Dimensions.get('window');
const WALLETS_STORAGE_KEY = '@skibidi_wallets';

export default function OnboardingScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkExistingWallets();
  }, []);

  const checkExistingWallets = async () => {
    try {
      const storedWallets = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      if (storedWallets) {
        const wallets = JSON.parse(storedWallets);
        if (wallets.length > 0) {
          // If wallets exist, go directly to MainTabs
          navigation.replace('MainTabs');
          return;
        }
      }
      
      // If no wallets exist, show onboarding screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.MEDIUM,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error checking existing wallets:', error);
      // On error, show onboarding screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.MEDIUM,
        useNativeDriver: true,
      }).start();
    }
  };

  const createNewWallet = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateWallet');
  };

  const restoreWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Restore');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>💎</Text>
          <Text style={styles.brandName}>Skibidi</Text>
          <Text style={styles.tagline}>Bitcoin Wallet</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={createNewWallet}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.XL * 3,
  },
  
  logoEmoji: {
    fontSize: 64,
    marginBottom: SPACING.MD,
  },
  
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  tagline: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  buttonContainer: {
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
}); 