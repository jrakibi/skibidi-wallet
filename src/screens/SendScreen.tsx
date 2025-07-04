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
  Clipboard,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  TYPOGRAPHY,
  RADIUS
} from '../theme';
import QRCode from 'react-native-qrcode-svg';
import { getApiUrl, BITCOIN_NETWORK } from '../config';
import ContactListModal from '../components/ContactListModal';
import { Contact } from '../components/ContactCard';
import { Ionicons } from '@expo/vector-icons';

type SendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Send'>;
type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

type Props = {
  navigation: SendScreenNavigationProp;
  route: SendScreenRouteProp;
};

const { width, height } = Dimensions.get('window');

export default function SendScreen({ navigation, route }: Props) {
  const { walletId, walletMnemonic } = route.params;
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const [animationPhase, setAnimationPhase] = useState<'idle' | 'animating' | 'success' | 'printing' | 'receipt'>('idle');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  
  // Bitcoin price (you might want to fetch this from an API)
  const BTC_PRICE_USD = 43000; // Example price, should be fetched from API
  const SATS_PER_BTC = 100000000;
  
  // Conversion function
  const satsToUSD = (sats: number) => {
    return ((sats / SATS_PER_BTC) * BTC_PRICE_USD).toFixed(2);
  };
  
  const getSecondaryAmount = () => {
    if (!amount) return '';
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return '';
    return `$${satsToUSD(numAmount)}`;
  };

  // Enhanced animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const uiFadeAnim = useRef(new Animated.Value(0)).current; // Start faded out for smooth entrance
  const skibidiYAnim = useRef(new Animated.Value(0)).current; // For skibidi vertical movement
  const skibidiScaleAnim = useRef(new Animated.Value(1)).current; // For skibidi scaling
  const successFadeAnim = useRef(new Animated.Value(0)).current; // For success state
  const slideUpAnim = useRef(new Animated.Value(50)).current; // For sliding elements up
  
  // Receipt animation values
  const receiptScaleAnim = useRef(new Animated.Value(0)).current; // For receipt zoom animation
  const receiptOpacityAnim = useRef(new Animated.Value(0)).current; // For receipt fade in/out
  const receiptSlideAnim = useRef(new Animated.Value(height)).current; // For receipt slide up from bottom
  
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

    // Check if it's a test address - skip real API call
    const isTestMode = address.trim().toLowerCase() === 'test' || 
                      address.trim().toLowerCase() === 'demo' ||
                      address.trim() === '1TestSkibidiReceiptAnimation123456';

    if (isTestMode) {
      console.log('🧪 Test mode activated - simulating transaction...');
      
      // Set a fake transaction ID for demo purposes
      setTransactionId('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
      
      // Simulate API delay
      setTimeout(() => {
        // API call is complete - trigger shoot up animation
        apiCompleteRef.current = true;
        if (shootUpRef.current) {
          shootUpRef.current();
        }
        
        // Show receipt success animation after skibidi shoots up
        setTimeout(() => {
          setAnimationPhase('success');
          startReceiptAnimation();
          // No auto navigation - stay on the animation screen
        }, 1000);
      }, 800); // Simulate network delay
      
      return;
    }

    try {
      const response = await fetch(getApiUrl('/send-bitcoin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mnemonic: walletMnemonic,
          to_address: address.trim(),
          amount_sats: Number(amount),
          network: BITCOIN_NETWORK, // Specify mainnet instead of testnet
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the transaction ID for blockchain explorer link
        if (result.data && result.data.txid) {
          setTransactionId(result.data.txid);
        }
        
        // API call is complete - trigger shoot up animation
        apiCompleteRef.current = true;
        if (shootUpRef.current) {
          shootUpRef.current();
        }
        
        // Show receipt success animation after skibidi shoots up
        setTimeout(() => {
          setAnimationPhase('success');
          startReceiptAnimation();
          // No auto navigation - stay on the animation screen
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
        receiptScaleAnim.setValue(0);
        receiptOpacityAnim.setValue(0);
        receiptSlideAnim.setValue(height);
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
      receiptScaleAnim.setValue(0);
      receiptOpacityAnim.setValue(0);
      receiptSlideAnim.setValue(height);
      apiCompleteRef.current = false;
    }
  };

  const startReceiptAnimation = () => {
    // Start with image super zoomed in (300%) and visible
    receiptScaleAnim.setValue(3.0);
    receiptOpacityAnim.setValue(1);
    
    // Zoom out from 300% to normal size and stay there
    Animated.timing(receiptScaleAnim, {
      toValue: 1.0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // After animation completes, show printing state
      setTimeout(() => {
        setAnimationPhase('printing');
        
        // Wait additional time for "printing" then show receipt
        setTimeout(() => {
          setAnimationPhase('receipt');
          startReceiptSlideAnimation();
        }, 3000); // Wait 3 seconds during printing phase
      }, 1500); // Hold the image for 1.5 seconds then show printing
    });
  };

  const startReceiptSlideAnimation = () => {
    // Start receipt at bottom of screen
    receiptSlideAnim.setValue(height);
    
    // Slide up from bottom to center
    Animated.timing(receiptSlideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const startSendAnimation = () => {
    if (animationPhase !== 'idle') return;
    
    console.log('🚀 Starting send animation...');
    setAnimationPhase('animating');
    setTransactionId(null); // Reset transaction ID for new transaction
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

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setAddress(contact.address);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openContactModal = () => {
    setShowContactModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
  };

  const openBlockchainExplorer = async () => {
    if (!transactionId) {
      Alert.alert('Error', 'Transaction ID not available');
      return;
    }

    try {
      // Dynamically choose explorer URL based on network configuration
      const networkPath = BITCOIN_NETWORK === 'mainnet' ? '' : '/testnet';
      const explorerUrl = `https://mempool.space${networkPath}/tx/${transactionId}`;
      const networkDisplayName = BITCOIN_NETWORK === 'mainnet' ? 'Bitcoin' : 'Bitcoin Testnet';
      
      const supported = await Linking.canOpenURL(explorerUrl);
      if (supported) {
        await Linking.openURL(explorerUrl);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert(
          'Cannot Open Link',
          `Transaction ID: ${transactionId}\n\nYou can search for this transaction on mempool.space${networkPath}`,
          [
            {
              text: 'Copy Transaction ID',
              onPress: () => {
                Clipboard.setString(transactionId);
                Alert.alert('Copied!', 'Transaction ID copied to clipboard');
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error Opening Link',
        `Transaction ID: ${transactionId}\n\nYou can search for this transaction on mempool.space${BITCOIN_NETWORK === 'mainnet' ? '' : '/testnet'}`,
        [
          {
            text: 'Copy Transaction ID',
            onPress: () => {
              Clipboard.setString(transactionId);
              Alert.alert('Copied!', 'Transaction ID copied to clipboard');
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
    }
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
                        receiptScaleAnim.setValue(0);
            receiptOpacityAnim.setValue(0);
            receiptSlideAnim.setValue(height);
            successFadeAnim.setValue(0);
            }
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        
        {/* Main Content - Fade out during animation and hide during receipt */}
        {animationPhase !== 'animating' && animationPhase !== 'receipt' && (
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
                {selectedContact ? (
                  <View style={styles.selectedContactContainer}>
                    <View style={styles.selectedContactInfo}>
                      <Image 
                        source={selectedContact.imageSource} 
                        style={styles.selectedContactImage}
                        resizeMode="cover"
                      />
                      <View style={styles.selectedContactDetails}>
                        <Text style={styles.selectedContactName}>{selectedContact.name}</Text>
                        <Text style={styles.selectedContactAddress}>
                          {selectedContact.address.substring(0, 8)}...{selectedContact.address.substring(selectedContact.address.length - 8)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.clearContactButton}
                      onPress={() => {
                        setSelectedContact(null);
                        setAddress('');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons 
                        name="close" 
                        size={14} 
                        color={COLORS.TEXT_SECONDARY} 
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[
                    styles.inputContainer,
                    isAddressFocused && styles.inputContainerFocused
                  ]}>
                    <TextInput
                      style={styles.inputWithIcons}
                      value={address}
                      onChangeText={(text) => {
                        setAddress(text);
                        // Clear selected contact if user types manually
                        if (selectedContact) {
                          setSelectedContact(null);
                        }
                      }}
                      placeholder="Search or Enter"
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      autoCapitalize="none"
                      autoCorrect={false}
                      multiline={false}
                      editable={animationPhase === 'idle'}
                      returnKeyType="next"
                      onFocus={() => setIsAddressFocused(true)}
                      onBlur={() => setIsAddressFocused(false)}
                      onSubmitEditing={() => {
                        // Focus on amount input or dismiss keyboard
                        Keyboard.dismiss();
                      }}
                      blurOnSubmit={true}
                    />
                    <View style={styles.inputActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={async () => {
                          try {
                            const clipboardText = await Clipboard.getString();
                            if (clipboardText.trim()) {
                              // Validate if it's a Bitcoin address (mainnet or testnet)
                              const isValidBitcoinAddress = clipboardText.match(/^(bc1|tb1|[13mn2])[a-zA-HJ-NP-Z0-9]{25,87}$/);
                              
                              if (isValidBitcoinAddress) {
                                setAddress(clipboardText.trim());
                                setSelectedContact(null); // Clear any selected contact
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              } else {
                                Alert.alert(
                                  'Invalid Address',
                                  'The clipboard does not contain a valid Bitcoin address.',
                                  [{ text: 'OK', style: 'default' }]
                                );
                              }
                            } else {
                              Alert.alert(
                                'Clipboard Empty',
                                'No text found in clipboard.',
                                [{ text: 'OK', style: 'default' }]
                              );
                            }
                          } catch (error) {
                            Alert.alert(
                              'Error',
                              'Could not access clipboard.',
                              [{ text: 'OK', style: 'default' }]
                            );
                          }
                        }}
                        disabled={animationPhase !== 'idle'}
                      >
                        <Text style={[
                          styles.actionButtonText,
                          isAddressFocused && styles.actionButtonTextFocused
                        ]}>Paste</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.iconButton,
                          isAddressFocused && styles.iconButtonFocused
                        ]}
                        onPress={openContactModal}
                        disabled={animationPhase !== 'idle'}
                      >
                        <Ionicons 
                          name="people-outline" 
                          size={18} 
                          color={isAddressFocused ? '#FF6B00' : COLORS.TEXT_PRIMARY} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.iconButton,
                          isAddressFocused && styles.iconButtonFocused
                        ]}
                                              onPress={() => {
                        navigation.navigate('QRScanner', {
                          onScan: (scannedData: string) => {
                            setAddress(scannedData);
                            setSelectedContact(null); // Clear any selected contact
                          }
                        });
                      }}
                        disabled={animationPhase !== 'idle'}
                      >
                        <Ionicons 
                          name="qr-code-outline" 
                          size={18} 
                          color={isAddressFocused ? '#FF6B00' : COLORS.TEXT_PRIMARY} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AMOUNT</Text>
                <View style={[
                  styles.amountContainer,
                  isAmountFocused && styles.amountContainerFocused
                ]}>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.TEXT_TERTIARY}
                    keyboardType="numeric"
                    editable={animationPhase === 'idle'}
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                    onFocus={() => setIsAmountFocused(true)}
                    onBlur={() => setIsAmountFocused(false)}
                    blurOnSubmit={true}
                  />
                  <Text style={styles.satLabel}>
                    SATS
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

        {/* Instructions Above Character - Fade out during animation and hide during receipt */}
        {animationPhase !== 'animating' && animationPhase !== 'receipt' && (
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

        {/* Success State - Receipt Animation */}
        {animationPhase === 'success' && (
          <Animated.View 
            style={[
              styles.receiptContainer, 
              { 
                opacity: receiptOpacityAnim,
                transform: [{ scale: receiptScaleAnim }]
              }
            ]}
          >
            <Image 
              source={require('../../assets/screens/receipt.png')} 
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {/* Printing State */}
        {animationPhase === 'printing' && (
          <View style={styles.printingContainer}>
            <Image 
              source={require('../../assets/screens/receipt.png')} 
              style={styles.receiptImage}
              resizeMode="contain"
            />
            <Text style={styles.printingText}>printing...</Text>
          </View>
        )}

        {/* Receipt Details Screen */}
        {animationPhase === 'receipt' && (
          <Animated.View 
            style={[
              styles.receiptDetailsContainer,
              { transform: [{ translateY: receiptSlideAnim }] }
            ]}
          >
            <View style={styles.receiptPaper}>
              {/* Receipt Header with Logo */}
              <View style={styles.receiptHeader}>
                <Image
                  source={require('../../assets/brainrot/brainrot6.png')}
                  style={styles.receiptLogo}
                  resizeMode="contain"
                />
                <Text style={styles.businessName}>SKIBIDI CASH</Text>
                <Text style={styles.businessSubtitle}>Digital Payment Services</Text>
              </View>
              
                              <View style={styles.solidDivider} />
                
                <View style={styles.transactionHeader}>
                  <View style={styles.checkmarkContainer}>
                    <View style={styles.checkmarkCircle}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.transactionStatus}>Transaction{'\n'}Successful</Text>
                  </View>
                </View>
                
                <View style={styles.dashedDivider} />
              
              <View style={styles.receiptBody}>
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptLabel}>DATE:</Text>
                  <Text style={styles.receiptValue}>{new Date().toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptLabel}>TIME:</Text>
                  <Text style={styles.receiptValue}>{new Date().toLocaleTimeString()}</Text>
                </View>
                
                                 <View style={styles.dashedDivider} />
                 
                 <View style={styles.amountSection}>
                   <Text style={styles.amountLabel}>AMOUNT SENT:</Text>
                   <View style={styles.amountRow}>
                     <Text style={styles.amountValue}>{Number(amount).toLocaleString()}</Text>
                     <Text style={styles.currencyLabel}>sats</Text>
                   </View>
                 </View>
                 
                 <View style={styles.dashedDivider} />
                
                <View style={styles.addressSection}>
                  <Text style={styles.receiptLabel}>TO ADDRESS:</Text>
                  <Text style={styles.addressValue}>
                    {address.length > 20 ? `${address.substring(0, 8)}...${address.substring(address.length - 8)}` : address}
                  </Text>
                </View>
                
                                                  <View style={styles.dashedDivider} />
                 
                 <View style={styles.statusSection}>
                   <Text style={styles.receiptLabel}>STATUS:</Text>
                   <Text style={styles.statusValue}>CONFIRMED</Text>
                 </View>
                 
                 {/* Transaction ID and Explorer Link */}
                 {transactionId && (
                   <>
                     <View style={styles.dashedDivider} />
                     <View style={styles.explorerSection}>
                       <Text style={styles.receiptLabel}>TRANSACTION ID:</Text>
                       <Text style={styles.transactionIdText}>
                         {transactionId.substring(0, 8)}...{transactionId.substring(transactionId.length - 8)}
                       </Text>
                       <TouchableOpacity 
                         style={styles.explorerButton}
                         onPress={openBlockchainExplorer}
                       >
                         <Text style={styles.explorerButtonText}>🔍 View on Explorer</Text>
                       </TouchableOpacity>
                     </View>
                   </>
                 )}
               </View>
               
               <View style={styles.solidDivider} />
              
              <Text style={styles.thankYouMessage}>
                Thank you for using{'\n'}Skibidi Cash!
              </Text>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value="https://bitcoindevs.xyz/"
                  size={60}
                  color="#000000"
                  backgroundColor="#d1cab8"
                />
                <Text style={styles.qrFooter}>bitcoindevs.xyz</Text>
              </View>
              
              {/* Wavy torn edge effect */}
              <View style={styles.tornEdgeContainer}>
                <View style={styles.waveEdge1} />
                <View style={styles.waveEdge2} />
                <View style={styles.waveEdge3} />
                <View style={styles.waveEdge4} />
                <View style={styles.waveEdge5} />
                <View style={styles.waveEdge6} />
                <View style={styles.waveEdge7} />
              </View>
            </View>
            
            
            </Animated.View>
          )}

        {/* Contact Selection Modal */}
        <ContactListModal
          visible={showContactModal}
          onClose={closeContactModal}
          onSelectContact={handleSelectContact}
          selectedContactId={selectedContact?.id}
        />

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
    paddingTop: SPACING.XXL,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: SPACING.MD,
  },
  inputGroup: {
    marginBottom: SPACING.XL,
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
    padding: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 36,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  
  amountContainerFocused: {
    borderBottomColor: '#FF6B00',
  },
  
  amountInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    padding: 0,
    minHeight: 36,
  },
  
  satLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    letterSpacing: 1,
  },
  
  secondaryAmount: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
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
    width: 200,
    height: 200,
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
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    marginTop: SPACING.MD,
  },
  atmImage: {
    width: 300,
    height: 300,
  },
  receiptContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND, // Solid background, no transparency
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, // Ensure it's on top
  },
  receiptImage: {
    width: 400,
    height: 400,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  receiptContent: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.XL,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.BITCOIN_ORANGE,
    maxWidth: '90%',
  },
  receiptTitle: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.BITCOIN_ORANGE,
    marginBottom: SPACING.SM,
    letterSpacing: 2,
    textAlign: 'center',
  },
  receiptAmount: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  receiptMessage: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  receiptDetailsContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  toiletTerminalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  terminalTitle: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 4,
  },
  receiptPaper: {
    backgroundColor: '#d1cab8', // Custom beige receipt color
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: SPACING.XL,
    paddingHorizontal: SPACING.LG,
    width: '85%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    // Subtle border to define the receipt edges
    borderWidth: 1,
    borderColor: '#b8ad9a',
    borderBottomWidth: 0,
    // Add torn edge effect at bottom
    position: 'relative',
  },
  terminalHeader: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING.LG,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
  },
  checkmarkCircle: {
    backgroundColor: '#1a1a1a', // Dark circle background
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  checkmark: {
    fontSize: 18,
    color: '#e1af6c', // Golden checkmark for success
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a', // Dark text
    textAlign: 'left',
  },
  transactionDetails: {
    marginBottom: SPACING.MD,
  },
  amountSentLabel: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: TYPOGRAPHY.BOLD,
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  btcLabel: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a',
    marginBottom: SPACING.MD,
    textAlign: 'center',
    letterSpacing: 2,
  },

  addressLabel: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Courier',
    marginBottom: SPACING.MD,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: SPACING.SM,
    borderRadius: 4,
  },
  thankYouText: {
    fontSize: 20,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: TYPOGRAPHY.BOLD,
    marginVertical: SPACING.LG,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  receiptDivider: {
    fontSize: 12,
    color: '#444444',
    textAlign: 'center',
    fontFamily: 'Courier',
    marginVertical: SPACING.XS,
    letterSpacing: 1,
  },
  receiptFooter: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    marginTop: SPACING.MD,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  doneReceiptButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XL * 2,
    marginTop: SPACING.XL,
  },
  doneReceiptButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  
  // New receipt styles
  receiptHeader: {
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  receiptLogo: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  businessName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a',
    letterSpacing: 2,
    textAlign: 'center',
  },
  businessSubtitle: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginTop: 1,
  },
  transactionHeader: {
    alignItems: 'center',
    marginVertical: SPACING.XS,
  },
  receiptBody: {
    marginVertical: SPACING.XS,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
  },
  receiptLabel: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  receiptValue: {
    fontSize: 10,
    color: '#1a1a1a',
    fontFamily: 'Courier',
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: SPACING.XS,
  },
  amountLabel: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a',
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  addressSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  addressValue: {
    fontSize: 9,
    color: '#333333',
    fontFamily: 'Courier',
    marginTop: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 4,
    borderRadius: 4,
    textAlign: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
  },
  statusValue: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  thankYouMessage: {
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    marginVertical: SPACING.XS,
  },
  qrFooter: {
    fontSize: 9,
    color: '#333333',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Divider styles
  solidDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 6,
    width: '100%',
  },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#666666',
    borderStyle: 'dashed',
    marginVertical: 4,
    width: '100%',
  },
  
  // Wavy torn edge effect
  tornEdgeContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  waveEdge1: {
    width: '15%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,
  },
  waveEdge2: {
    width: '15%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 90,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  waveEdge3: {
    width: '15%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  waveEdge4: {
    width: '15%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  waveEdge5: {
    width: '15%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  waveEdge6: {
    width: '18%',
    height: 30,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 0,
  },
  waveEdge7: {
    width: '7%',
    height: 50,
    backgroundColor: '#d1cab8',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  
  // Printing state styles
  printingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  printingText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: SPACING.LG,
  },
  
  // Contact selection styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    paddingBottom: SPACING.XS,
  },
  inputContainerFocused: {
    borderBottomColor: '#FF6B00', // Orange accent on focus
  },
  inputWithIcons: {
    flex: 1,
    padding: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: 'transparent',
    minHeight: 36,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.SM,
  },
  actionButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    marginRight: SPACING.XS,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  actionButtonTextFocused: {
    color: '#FF6B00', // Orange accent on focus
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
    marginLeft: SPACING.XS,
  },
  iconButtonFocused: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
  },
  selectedContactContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 2,
    borderColor: '#FF6B00', // Orange accent to match
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedContactImage: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.SM,
    marginRight: SPACING.SM,
  },
  selectedContactDetails: {
    flex: 1,
  },
  selectedContactName: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  selectedContactAddress: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  clearContactButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.SM,
  },
  clearContactText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  
  // Blockchain explorer styles
  explorerSection: {
    marginTop: SPACING.SM,
    alignItems: 'center',
  },
  transactionIdText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
    marginVertical: SPACING.XS,
    textAlign: 'center',
  },
  explorerButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.SM,
    marginTop: SPACING.SM,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  explorerButtonText: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
}); 