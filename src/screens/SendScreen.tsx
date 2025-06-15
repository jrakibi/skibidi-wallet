import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  TEXT_STYLES, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  CARD_STYLES,
  BUTTON_STYLES 
} from '../theme';

type SendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Send'>;
type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

type Props = {
  navigation: SendScreenNavigationProp;
  route: SendScreenRouteProp;
};

export default function SendScreen({ navigation, route }: Props) {
  const { walletId } = route.params;
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendTransaction = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Enter Bitcoin address');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid amount in sats');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://172.20.10.3:8080/send-bitcoin', {
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
        Alert.alert(
          'Sent 🚀',
          `${Number(amount).toLocaleString()} sats sent`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Failed', result.error || 'Try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    } finally {
      setSending(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 50000];

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
        <Text style={styles.headerTitle}>Send Bitcoin</Text>
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
            
            {/* Address Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="bc1q..."
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  multiline
                  numberOfLines={2}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => navigation.navigate('QRScanner', {
                    onScan: (data: string) => setAddress(data)
                  })}
                >
                  <Text style={styles.scanButtonText}>📷</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  keyboardType="numeric"
                />
                <Text style={styles.bitcoinSymbol}>₿</Text>
              </View>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsTitle}>Quick amounts</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={styles.quickAmountText}>
                      {quickAmount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!address.trim() || !amount.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendTransaction}
              disabled={!address.trim() || !amount.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? 'Sending...' : 'Send Bitcoin'}
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  
  inputContainer: {
    marginBottom: SPACING.XL,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
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
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    textAlignVertical: 'top',
    minHeight: 56,
  },
  
  scanButton: {
    padding: SPACING.MD,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.BORDER_LIGHT,
  },
  
  scanButtonText: {
    fontSize: 20,
    color: COLORS.TEXT_SECONDARY,
  },
  
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
  },
  
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    height: 80,
  },
  
  bitcoinSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  
  quickAmountsContainer: {
    marginBottom: SPACING.XL,
  },
  
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  
  quickAmountButton: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  quickAmountText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  sendButtonDisabled: {
    backgroundColor: COLORS.SURFACE,
    opacity: 0.5,
  },
  
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 