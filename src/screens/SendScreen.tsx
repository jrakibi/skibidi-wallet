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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

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

  const sendBitcoin = async () => {
    if (!address.trim()) {
      Alert.alert('Bruh Moment 💀', 'Enter a valid address fr fr');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Sus Amount 🤔', 'Enter a valid amount in sats');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.1.5:8080/send-bitcoin', {
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
          'Transaction Sent! 🚀',
          `TXID: ${result.data.txid}\n\nIt's giving successful transfer vibes! 💀`,
          [{ text: 'Based', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Transaction Failed 💀', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Network Error 🤡', 'Cannot connect to backend frfr');
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={['#FF3333', '#FF6666', '#FF9999']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← BACK TO STASH</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>💸 YEET SOME SATS 💸</Text>
            <Text style={styles.subtitle}>SEND BITCOIN LIKE A SIGMA</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>TO ADDRESS (WHO'S GETTING THE BAG?)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="bc1q... or 1... or 3..."
                placeholderTextColor="#666"
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>AMOUNT IN SATOSHIS (HOW MUCH?)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="1000"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <Text style={styles.conversionText}>
                ≈ {amount ? (Number(amount) / 100000000).toFixed(8) : '0.00000000'} BTC
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendingButton]}
              onPress={sendBitcoin}
              disabled={sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? '🚀 YEETING...' : '🚀 YEET THE SATS'}
              </Text>
              <Text style={styles.sendButtonSubtext}>
                {sending ? 'BROADCASTING TO BLOCKCHAIN...' : 'NO TAKE BACKS FR FR'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warnings}>
            <Text style={styles.warningText}>⚠️ DOUBLE CHECK EVERYTHING ⚠️</Text>
            <Text style={styles.warningSubtext}>BITCOIN TRANSACTIONS ARE FINAL</Text>
            <Text style={styles.warningSubtext}>NO CUSTOMER SERVICE TO CALL 💀</Text>
            <Text style={styles.warningSubtext}>IT'S GIVING IMMUTABLE VIBES</Text>
          </View>

          <Text style={styles.memeText}>
            🦈 TRALALERO TRALALA SUPPORTS YOUR TRANSACTION 🦈
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    textShadowColor: '#FFF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginTop: 10,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minHeight: 50,
  },
  conversionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 5,
    textAlign: 'right',
  },
  sendButton: {
    backgroundColor: '#00FF00',
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 20,
    alignItems: 'center',
    transform: [{ rotate: '-1deg' }],
    marginTop: 20,
  },
  sendingButton: {
    backgroundColor: '#FFFF00',
    transform: [{ rotate: '1deg' }],
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  sendButtonSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginTop: 5,
  },
  warnings: {
    backgroundColor: '#FFFF00',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    alignItems: 'center',
    transform: [{ rotate: '1deg' }],
    marginBottom: 20,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
  },
  warningSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 3,
  },
  memeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
}); 