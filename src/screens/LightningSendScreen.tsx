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

type LightningSendScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LightningSend'>;
type LightningSendScreenRouteProp = RouteProp<RootStackParamList, 'LightningSend'>;

type Props = {
  navigation: LightningSendScreenNavigationProp;
  route: LightningSendScreenRouteProp;
};

export default function LightningSendScreen({ navigation }: Props) {
  const [invoice, setInvoice] = useState('');
  const [lnurl, setLnurl] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'invoice' | 'lnurl'>('invoice');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [lightningAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.SLOW,
      useNativeDriver: true,
    }).start();

    // Lightning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightningAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(lightningAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const payInvoice = async () => {
    if (!invoice.trim()) {
      Alert.alert('Invoice Required', 'Please paste a Lightning invoice (starts with lnbc...)');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.18.74:8080/lightning/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bolt11: invoice.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Payment Sent! ⚡',
          `Your Lightning payment zapped instantly!\n\nAmount: ${result.data.amount_msats/1000} sats\nStatus: ${result.data.status}`,
          [{ text: 'No cap fr 🔥', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Try again bestie');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Connection issue - check your wifi');
    } finally {
      setSending(false);
    }
  };

  const payLnurl = async () => {
    if (!lnurl.trim()) {
      Alert.alert('LNURL Required', 'Please paste a valid LNURL');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Amount Required', 'Enter amount in sats for the micro payment');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.18.74:8080/lightning/pay-lnurl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lnurl: lnurl.trim(),
          amount_msats: Number(amount) * 1000, // Convert sats to millisats
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'LNURL Payment Sent! ⚡',
          `Micro payment executed instantly!\n\nAmount: ${amount} sats\nStatus: ${result.data.status}`,
          [{ text: 'That slaps 🚀', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'LNURL payment skill issue');
      }
    } catch (error) {
      Alert.alert('Network Error', 'LNURL fetch failed - try again');
    } finally {
      setSending(false);
    }
  };

  const quickAmounts = [1, 10, 50, 100, 500, 1000];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Lightning Send</Text>
          <Text style={styles.headerSubtitle}>instant micro payments fr</Text>
        </View>
        <Animated.View style={[styles.headerRight, { opacity: lightningAnim }]}>
          <Text style={styles.headerEmoji}>⚡</Text>
        </Animated.View>
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
            
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, tab === 'invoice' && styles.activeTab]}
                onPress={() => setTab('invoice')}
              >
                <Text style={[styles.tabText, tab === 'invoice' && styles.activeTabText]}>
                  Invoice
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'lnurl' && styles.activeTab]}
                onPress={() => setTab('lnurl')}
              >
                <Text style={[styles.tabText, tab === 'lnurl' && styles.activeTabText]}>
                  LNURL
                </Text>
              </TouchableOpacity>
            </View>

            {/* Invoice Tab */}
            {tab === 'invoice' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Lightning Invoice</Text>
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>BOLT11 Invoice</Text>
                    <TextInput
                      style={styles.textInput}
                      value={invoice}
                      onChangeText={setInvoice}
                      placeholder="lnbc1000u1p..."
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Instant Payment Button */}
                <TouchableOpacity
                  style={[
                    styles.payButton,
                    (!invoice.trim() || sending) && styles.payButtonDisabled
                  ]}
                  onPress={payInvoice}
                  disabled={!invoice.trim() || sending}
                >
                  <Text style={styles.payButtonText}>
                    {sending ? '⚡ Zapping...' : '⚡ Pay Invoice Instantly'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* LNURL Tab */}
            {tab === 'lnurl' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>LNURL Payment</Text>
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>LNURL</Text>
                    <TextInput
                      style={styles.textInput}
                      value={lnurl}
                      onChangeText={setLnurl}
                      placeholder="lnurl1..."
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount (sats)</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmountContainer}>
                  <Text style={styles.quickAmountTitle}>Quick Amounts</Text>
                  <View style={styles.quickAmountGrid}>
                    {quickAmounts.map((quickAmount) => (
                      <TouchableOpacity
                        key={quickAmount}
                        style={styles.quickAmountButton}
                        onPress={() => setAmount(quickAmount.toString())}
                      >
                        <Text style={styles.quickAmountText}>{quickAmount}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* LNURL Payment Button */}
                <TouchableOpacity
                  style={[
                    styles.payButton,
                    (!lnurl.trim() || !amount.trim() || sending) && styles.payButtonDisabled
                  ]}
                  onPress={payLnurl}
                  disabled={!lnurl.trim() || !amount.trim() || sending}
                >
                  <Text style={styles.payButtonText}>
                    {sending ? '⚡ Processing...' : '⚡ Send Micro Payment'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>⚡</Text>
              <Text style={styles.infoTitle}>Lightning Network</Text>
              <Text style={styles.infoText}>
                Instant, near-zero fee payments. Perfect for micro transactions down to 1 sat. No cap.
              </Text>
            </View>

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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    backgroundColor: COLORS.SURFACE,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.BACKGROUND,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  headerTitle: {
    ...TEXT_STYLES.heading,
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
  },
  content: {
    padding: SPACING.MD,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: 4,
    marginBottom: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    borderRadius: RADIUS.MD,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.BACKGROUND,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    ...TEXT_STYLES.heading,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  inputCard: {
    ...CARD_STYLES.base,
    padding: SPACING.MD,
  },
  inputLabel: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountInput: {
    ...TEXT_STYLES.heading,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: SPACING.MD,
  },
  quickAmountContainer: {
    marginBottom: SPACING.LG,
  },
  quickAmountTitle: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  quickAmountButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  quickAmountText: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
  },
  payButton: {
    backgroundColor: COLORS.ACCENT,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    marginBottom: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  payButtonDisabled: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    opacity: 0.5,
  },
  payButtonText: {
    ...TEXT_STYLES.body,
    color: COLORS.BACKGROUND,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    ...CARD_STYLES.base,
    padding: SPACING.LG,
    alignItems: 'center',
    backgroundColor: COLORS.SUCCESS + '10',
    borderColor: COLORS.SUCCESS,
  },
  infoEmoji: {
    fontSize: 32,
    marginBottom: SPACING.SM,
  },
  infoTitle: {
    ...TEXT_STYLES.heading,
    color: COLORS.SUCCESS,
    marginBottom: SPACING.SM,
    fontSize: 16,
  },
  infoText: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontSize: 14,
  },
}); 