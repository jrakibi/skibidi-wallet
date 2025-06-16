import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  PanResponder,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  TYPOGRAPHY
} from '../theme';

type SendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Send'>;
type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

type Props = {
  navigation: SendScreenNavigationProp;
  route: SendScreenRouteProp;
};

const { width, height } = Dimensions.get('window');

export default function SendScreen({ navigation, route }: Props) {
  const { walletId } = route.params;
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [showUSD, setShowUSD] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'animating' | 'success'>('idle');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Bitcoin price (you might want to fetch this from an API)
  const BTC_PRICE_USD = 43000; // Example price, should be fetched from API
  const SATS_PER_BTC = 100000000;
  
  // Conversion functions
  const satsToUSD = (sats: number) => {
    return ((sats / SATS_PER_BTC) * BTC_PRICE_USD).toFixed(2);
  };
  
  const usdToSats = (usd: number) => {
    return Math.round((usd / BTC_PRICE_USD) * SATS_PER_BTC);
  };
  
  const getDisplayAmount = () => {
    if (!amount) return '';
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return amount;
    
    if (showUSD) {
      return satsToUSD(numAmount);
    }
    return amount;
  };
  
  const getSecondaryAmount = () => {
    if (!amount) return '';
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return '';
    
    if (showUSD) {
      return `${numAmount.toLocaleString()} sats`;
    }
    return `$${satsToUSD(numAmount)}`;
  };
  
  const handleAmountChange = (text: string) => {
    if (showUSD) {
      // Convert USD input to sats for storage
      const usdAmount = Number(text);
      if (!isNaN(usdAmount)) {
        setAmount(usdToSats(usdAmount).toString());
      } else {
        setAmount('');
      }
    } else {
      setAmount(text);
    }
  };
  
  // Enhanced animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const uiFadeAnim = useRef(new Animated.Value(0)).current; // Start faded out for smooth entrance
  const skibidiYAnim = useRef(new Animated.Value(0)).current; // For skibidi vertical movement
  const skibidiScaleAnim = useRef(new Animated.Value(1)).current; // For skibidi scaling
  const successFadeAnim = useRef(new Animated.Value(0)).current; // For success state
  const slideUpAnim = useRef(new Animated.Value(50)).current; // For sliding elements up
  
  // Ref to track when API call is complete
  const apiCompleteRef = useRef(false);
  const shootUpRef = useRef<(() => void) | undefined>(undefined);

  React.useEffect(() => {
    // Smooth entrance animation - fade in all elements
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(uiFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start bouncing animation only when idle
    const startBouncing = () => {
      if (animationPhase === 'idle') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -15,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    };

    // Delay bouncing to let entrance animation complete
    setTimeout(startBouncing, 800);

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [animationPhase]);

  const sendTransaction = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Enter Bitcoin address');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid amount');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://10.0.101.247:8080/send-bitcoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: walletId,
          to_address: address.trim(),
          amount_sats: Number(amount),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // API call is complete - trigger shoot up animation
        apiCompleteRef.current = true;
        if (shootUpRef.current) {
          shootUpRef.current();
        }
        
        // Show success after animation completes
        setTimeout(() => {
          setAnimationPhase('success');
          Animated.timing(successFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
          
          // Auto navigate back after showing success
          setTimeout(() => {
            navigation.goBack();
          }, 2500);
        }, 1000); // Reduced wait time since we're now waiting for API
      } else {
        Alert.alert('Failed', result.error || 'Try again');
        setSending(false);
        setAnimationPhase('idle');
        // Reset animations
        uiFadeAnim.setValue(1);
        slideUpAnim.setValue(0);
        skibidiYAnim.setValue(0);
        skibidiScaleAnim.setValue(1);
        apiCompleteRef.current = false;
      }
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Network error. Try again.');
      setSending(false);
      setAnimationPhase('idle');
      // Reset animations
      uiFadeAnim.setValue(1);
      slideUpAnim.setValue(0);
      skibidiYAnim.setValue(0);
      skibidiScaleAnim.setValue(1);
      successFadeAnim.setValue(0);
      apiCompleteRef.current = false;
    }
  };

  const startSendAnimation = () => {
    if (animationPhase !== 'idle') return;
    
    console.log('🚀 Starting send animation...');
    setAnimationPhase('animating');
    bounceAnim.stopAnimation();
    bounceAnim.setValue(0);
    apiCompleteRef.current = false;
    
    // Step 1: Fade out ALL UI elements completely and aggressively
    console.log('💨 Fading out UI elements...');
    Animated.timing(uiFadeAnim, {
      toValue: 0,
      duration: 300, // Faster fade out
      useNativeDriver: true,
    }).start(() => {
      console.log('✅ UI elements faded out completely');
    });
    
    // Step 2: Move skibidi up slowly to middle of screen first
    setTimeout(() => {
      console.log('⬆️ Moving skibidi to middle...');
      Animated.timing(skibidiYAnim, {
        toValue: -height * 0.4, // Move to middle of screen
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        console.log('🔄 Waiting at middle for API response...');
        
        // Define the shoot up function
        const shootUp = () => {
          console.log('⚡ API complete! Starting fast shoot up...');
          
          // Fast movement to top with scaling - ONLY the skibidi character
          Animated.parallel([
            Animated.timing(skibidiYAnim, {
              toValue: -height - 100, // Shoot to top and beyond
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(skibidiScaleAnim, {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(skibidiScaleAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            console.log('🎯 Animation complete!');
          });
        };
        
        // Store the shoot up function so API can call it
        shootUpRef.current = shootUp;
        
        // If API is already complete, shoot up immediately
        if (apiCompleteRef.current) {
          shootUp();
        }
      });
    }, 100); // Start moving skibidi sooner
    
    // Start the actual send transaction
    sendTransaction();
  };

  const handleSkibidiPress = () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Enter Bitcoin address');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid amount');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startSendAnimation();
  };

  // Enhanced swipe up gesture handler
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to upward swipes and when not animating
      return animationPhase === 'idle' && Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
    },
    onPanResponderGrant: () => {
      if (animationPhase === 'idle') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (animationPhase === 'idle' && gestureState.dy < 0) {
        // Preview animation - slightly move skibidi up during swipe
        const moveAmount = Math.min(Math.abs(gestureState.dy) * 0.5, 50);
        skibidiYAnim.setValue(-moveAmount);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (animationPhase !== 'idle') return;
      
      const swipeDistance = Math.abs(gestureState.dy);
      const velocityY = Math.abs(gestureState.vy);
      
      // If it's a good upward swipe, send bitcoin
      if (swipeDistance > 50 || velocityY > 0.3) {
        handleSkibidiPress();
      } else {
        // Reset position if swipe wasn't strong enough
        Animated.timing(skibidiYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const isReadyToSend = address.trim() && amount.trim() && !sending && animationPhase === 'idle';

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        
        {/* Back/Close Button - Always visible and functional */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Reset any ongoing animations
            if (animationPhase !== 'idle') {
              setAnimationPhase('idle');
              setSending(false);
              // Reset all animations
              uiFadeAnim.setValue(1);
              slideUpAnim.setValue(0);
              skibidiYAnim.setValue(0);
              skibidiScaleAnim.setValue(1);
              successFadeAnim.setValue(0);
            }
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        
        {/* Main Content - Fade out during animation */}
        {animationPhase !== 'animating' && (
          <Animated.View style={[
            styles.content, 
            { 
              opacity: uiFadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}>
            
            {/* ATM Image at the top */}
            <View style={styles.atmContainer}>
              <Image 
                source={require('../../assets/atm.png')}
                style={styles.atmImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Input Fields - Also fade out during animation */}
            <View style={styles.inputSection}>
              
              {/* Bitcoin Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TO</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Bitcoin Address"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline={false}
                  editable={animationPhase === 'idle'}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // Focus on amount input or dismiss keyboard
                    Keyboard.dismiss();
                  }}
                  blurOnSubmit={true}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <View style={styles.amountHeader}>
                  <Text style={styles.inputLabel}>AMOUNT</Text>
                  <TouchableOpacity 
                    style={styles.currencyToggle}
                    onPress={() => setShowUSD(!showUSD)}
                    disabled={animationPhase !== 'idle'}
                  >
                    <Text style={styles.currencyToggleText}>
                      {showUSD ? 'USD' : 'SATS'} ↓
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={styles.amountInput}
                    value={getDisplayAmount()}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor={COLORS.TEXT_TERTIARY}
                    keyboardType="numeric"
                    editable={animationPhase === 'idle'}
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                    blurOnSubmit={true}
                  />
                  <Text style={styles.satLabel}>
                    {showUSD ? 'USD' : 'SATS'}
                  </Text>
                </View>
                {getSecondaryAmount() && (
                  <Text style={styles.secondaryAmount}>
                    ≈ {getSecondaryAmount()}
                  </Text>
                )}
              </View>

            </View>

          </Animated.View>
        )}

        {/* Instructions Above Character - Fade out during animation */}
        {animationPhase !== 'animating' && (
          <Animated.View style={[
            styles.instructionAboveCharacter, 
            { 
              opacity: uiFadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}>
            <Text style={[styles.instruction, { opacity: isReadyToSend ? 1 : 0.3 }]}>
              {isReadyToSend ? 'READY TO SEND!' : 'FILL IN DETAILS'}
            </Text>
          </Animated.View>
        )}

        {/* Skibidi Character at Bottom - Click/Tap + Swipe Up */}
        <TouchableOpacity 
          style={styles.characterTouchable}
          onPress={handleSkibidiPress}
          disabled={!isReadyToSend || sending}
          activeOpacity={0.8}
        >
          <Animated.View 
            style={[
              styles.characterSection, 
              { 
                transform: [
                  { translateY: Animated.add(bounceAnim, skibidiYAnim) },
                  { scale: skibidiScaleAnim }
                ],
                opacity: isReadyToSend ? 1 : 0.5,
              }
            ]}
            {...panResponder.panHandlers}
          >
            <Image 
              source={require('../../assets/skibidi-send.png')}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Floating Done Button - Shows when keyboard is visible */}
        {keyboardVisible && (
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={dismissKeyboard}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* Success State */}
        {animationPhase === 'success' && (
          <Animated.View style={[styles.successContainer, { opacity: successFadeAnim }]}>
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>🚀 SENT!</Text>
              <Text style={styles.successAmount}>
                {Number(amount).toLocaleString()} sats
              </Text>
              <Text style={styles.successMessage}>
                Transaction broadcasted successfully
              </Text>
            </View>
          </Animated.View>
        )}

      </View>
    </TouchableWithoutFeedback>
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
    paddingTop: SPACING.LG,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: SPACING.MD,
  },
  inputGroup: {
    marginBottom: SPACING.XXL,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 50,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  amountInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.DISPLAY,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    padding: 0,
    minHeight: 50,
  },
  satLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    letterSpacing: 1,
  },
  instructionAboveCharacter: {
    position: 'absolute',
    bottom: 220,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    letterSpacing: 1,
  },
  characterTouchable: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  characterSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  characterImage: {
    width: 150,
    height: 150,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  currencyToggle: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  currencyToggleText: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1,
  },
  secondaryAmount: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  successContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  successContent: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.XL,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BITCOIN_ORANGE,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.BITCOIN_ORANGE,
    marginBottom: SPACING.SM,
    letterSpacing: 2,
  },
  successAmount: {
    fontSize: TYPOGRAPHY.DISPLAY,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  successMessage: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  doneButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  atmContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  atmImage: {
    width: 280,
    height: 280,
  },
}); 