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
  CARD_STYLES 
} from '../theme';

type SendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Send'>;
type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

type Props = {
  navigation: SendScreenNavigationProp;
  route: SendScreenRouteProp;
};

type SendMode = 'onchain' | 'lightning';

export default function SendScreen({ navigation, route }: Props) {
  const { walletId } = route.params;
  const [mode, setMode] = useState<SendMode>('onchain');
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
      Alert.alert('Required', `Enter ${mode === 'onchain' ? 'Bitcoin address' : 'Lightning invoice'}`);
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid amount in sats');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const endpoint = mode === 'onchain' 
        ? 'http://192.168.18.74:8080/send-bitcoin'
        : 'http://192.168.18.74:8080/lightning/pay-invoice';

      const body = mode === 'onchain' 
        ? {
            wallet_id: walletId,
            to_address: address.trim(),
            amount_sats: Number(amount),
          }
        : {
            bolt11: address.trim(),
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        const emoji = mode === 'onchain' ? '🚀' : '⚡';
        const title = mode === 'onchain' ? 'Sent' : 'Zapped';
        Alert.alert(
          `${title} ${emoji}`,
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
        <Text style={styles.headerTitle}>Send</Text>
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
            
            {/* Mode Toggle */}
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'onchain' && styles.activeModeButton]}
                onPress={() => setMode('onchain')}
              >
                <Text style={[styles.modeText, mode === 'onchain' && styles.activeModeText]}>
                  Bitcoin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'lightning' && styles.activeModeButton]}
                onPress={() => setMode('lightning')}
              >
                <Text style={[styles.modeText, mode === 'lightning' && styles.activeModeText]}>
                  ⚡ Lightning
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {mode === 'onchain' ? 'Address' : 'Invoice'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder={mode === 'onchain' ? 'bc1q...' : 'lnbc...'}
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  multiline={mode === 'onchain'}
                  numberOfLines={mode === 'onchain' ? 2 : 1}
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
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>sats</Text>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmountsContainer}>
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

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!address.trim() || !amount.trim() || Number(amount) <= 0 || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendTransaction}
              disabled={!address.trim() || !amount.trim() || Number(amount) <= 0 || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? 'Sending...' : `Send ${mode === 'lightning' ? '⚡' : '🚀'}`}
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
  
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: 4,
    marginBottom: SPACING.XL,
  },
  
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    borderRadius: RADIUS.MD,
  },
  
  activeModeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  
  activeModeText: {
    color: COLORS.TEXT_PRIMARY,
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
  
  amountInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    height: 80,
  },
  
  unitText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
  },
  
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.XL,
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