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
  Share,
  Clipboard,
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
import QRCode from 'react-native-qrcode-svg';

type LightningReceiveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LightningReceive'>;
type LightningReceiveScreenRouteProp = RouteProp<RootStackParamList, 'LightningReceive'>;

type Props = {
  navigation: LightningReceiveScreenNavigationProp;
  route: LightningReceiveScreenRouteProp;
};

export default function LightningReceiveScreen({ navigation }: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [invoice, setInvoice] = useState('');
  const [creating, setCreating] = useState(false);
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
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(lightningAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const createInvoice = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Add a memo for your invoice');
      return;
    }

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.18.74:8080/lightning/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_msats: amount.trim() ? Number(amount) * 1000 : null, // Convert sats to millisats
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setInvoice(result.data.bolt11);
        Alert.alert(
          'Invoice Created! ⚡',
          `Your Lightning invoice is ready!\n\nAmount: ${amount || 'Any'} sats\nExpires in 1 hour`,
          [{ text: 'Let\'s go! 🚀' }]
        );
      } else {
        Alert.alert('Creation Failed', result.error || 'Try again bestie');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Connection issue - check your wifi');
    } finally {
      setCreating(false);
    }
  };

  const copyInvoice = async () => {
    if (!invoice) return;
    
    Clipboard.setString(invoice);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied! 📋', 'Invoice copied to clipboard');
  };

  const shareInvoice = async () => {
    if (!invoice) return;
    
    try {
      await Share.share({
        message: `Pay me via Lightning! ⚡\n\n${invoice}`,
      });
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share invoice');
    }
  };

  const clearInvoice = () => {
    setInvoice('');
    setAmount('');
    setDescription('');
  };

  const quickAmounts = [10, 50, 100, 500, 1000, 5000];

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
          <Text style={styles.headerTitle}>Lightning Request</Text>
          <Text style={styles.headerSubtitle}>get paid instantly fr</Text>
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
            
            {!invoice ? (
              <>
                {/* Amount Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount (sats) - Optional</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>
                      Leave blank for any amount
                    </Text>
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

                {/* Description Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.textInput}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="What's this payment for?"
                      placeholderTextColor={COLORS.TEXT_TERTIARY}
                      multiline
                      maxLength={100}
                    />
                  </View>
                </View>

                {/* Create Invoice Button */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!description.trim() || creating) && styles.createButtonDisabled
                  ]}
                  onPress={createInvoice}
                  disabled={!description.trim() || creating}
                >
                  <Text style={styles.createButtonText}>
                    {creating ? '⚡ Creating...' : '⚡ Create Lightning Invoice'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* QR Code Section */}
                <View style={styles.qrContainer}>
                  <Text style={styles.qrTitle}>Scan to Pay ⚡</Text>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={invoice}
                      size={200}
                      color={COLORS.TEXT_PRIMARY}
                      backgroundColor={COLORS.BACKGROUND}
                    />
                  </View>
                  <Text style={styles.qrSubtitle}>
                    {amount ? `${amount} sats` : 'Any amount'} • {description}
                  </Text>
                </View>

                {/* Invoice String */}
                <View style={styles.invoiceContainer}>
                  <Text style={styles.invoiceTitle}>Lightning Invoice</Text>
                  <TouchableOpacity style={styles.invoiceCard} onPress={copyInvoice}>
                    <Text style={styles.invoiceText} numberOfLines={3}>
                      {invoice}
                    </Text>
                    <Text style={styles.copyHint}>Tap to copy</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.actionButton} onPress={copyInvoice}>
                    <Text style={styles.actionButtonText}>📋 Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={shareInvoice}>
                    <Text style={styles.actionButtonText}>📤 Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={clearInvoice}>
                    <Text style={styles.actionButtonText}>🔄 New</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>⚡</Text>
              <Text style={styles.infoTitle}>Lightning Invoices</Text>
              <Text style={styles.infoText}>
                Create QR codes for instant Lightning payments. Perfect for tips, donations, or sales. Expires in 1 hour.
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
  amountInput: {
    ...TEXT_STYLES.heading,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 32,
    textAlign: 'center',
    paddingVertical: SPACING.MD,
  },
  helperText: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
    fontSize: 12,
  },
  textInput: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
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
  createButton: {
    backgroundColor: COLORS.ACCENT,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    marginBottom: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    opacity: 0.5,
  },
  createButtonText: {
    ...TEXT_STYLES.body,
    color: COLORS.BACKGROUND,
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  qrTitle: {
    ...TEXT_STYLES.heading,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontSize: 18,
  },
  qrCodeWrapper: {
    padding: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    marginBottom: SPACING.MD,
    ...SHADOWS.SUBTLE,
  },
  qrSubtitle: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  invoiceContainer: {
    marginBottom: SPACING.LG,
  },
  invoiceTitle: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  invoiceCard: {
    ...CARD_STYLES.base,
    padding: SPACING.MD,
  },
  invoiceText: {
    ...TEXT_STYLES.mono,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginBottom: SPACING.SM,
  },
  copyHint: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT_TERTIARY,
    fontSize: 10,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: SPACING.MD,
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  actionButtonText: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
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