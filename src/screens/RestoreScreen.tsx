import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type RestoreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Restore'>;

type Props = {
  navigation: RestoreScreenNavigationProp;
};

export default function RestoreScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState('');
  const [restoring, setRestoring] = useState(false);

  const restoreWallet = async () => {
    if (!mnemonic.trim()) {
      Alert.alert('Empty Mnemonic 💀', 'Enter your seed phrase fr fr');
      return;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      Alert.alert('Invalid Length 🤔', 'Seed phrase must be exactly 12 words');
      return;
    }

    setRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch('http://192.168.1.5:8080/restore-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: mnemonic.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Wallet Restored! 🎉',
          'Your wallet is back and ready to go! It\'s giving recovery vibes! 💀',
          [
            {
              text: 'Let\'s Go!',
              onPress: () => navigation.navigate('Wallet', {
                walletId: result.data.wallet_id,
                address: result.data.address,
                mnemonic: result.data.mnemonic,
              }),
            },
          ]
        );
      } else {
        Alert.alert('Restore Failed 💀', result.error || 'Invalid seed phrase');
      }
    } catch (error) {
      Alert.alert('Network Error 🤡', 'Cannot connect to backend frfr');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <LinearGradient colors={['#FF00FF', '#CC00CC', '#990099']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>🔄 RESTORE WALLET 🔄</Text>
            <Text style={styles.subtitle}>BRING YOUR STASH BACK FROM THE VOID</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 WHAT YOU NEED</Text>
            <Text style={styles.infoText}>• Your 12-word seed phrase</Text>
            <Text style={styles.infoText}>• Written in the correct order</Text>
            <Text style={styles.infoText}>• All words spelled correctly</Text>
            <Text style={styles.infoText}>• No extra spaces or characters</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ENTER YOUR 12-WORD SEED PHRASE:</Text>
            <TextInput
              style={styles.input}
              value={mnemonic}
              onChangeText={setMnemonic}
              placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
              placeholderTextColor="#666"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
            />
            
            <Text style={styles.wordCount}>
              Words entered: {mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0}/12
            </Text>

            <TouchableOpacity
              style={[styles.restoreButton, restoring && styles.restoringButton]}
              onPress={restoreWallet}
              disabled={restoring}
            >
              <Text style={styles.restoreButtonText}>
                {restoring ? '🔄 RESTORING...' : '🚀 RESTORE WALLET'}
              </Text>
              <Text style={styles.restoreButtonSubtext}>
                {restoring ? 'BRINGING YOUR STASH BACK...' : 'GET YOUR BITCOIN BACK FR FR'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ SECURITY REMINDERS ⚠️</Text>
            <Text style={styles.warningText}>• Only restore on trusted devices</Text>
            <Text style={styles.warningText}>• Make sure you're alone</Text>
            <Text style={styles.warningText}>• This app doesn't store your seed phrase</Text>
            <Text style={styles.warningText}>• It's giving maximum security vibes</Text>
          </View>

          <Text style={styles.memeText}>
            🦈 TRALALERO TRALALA HELPS YOU RECOVER 🦈
          </Text>
          <Text style={styles.memeText}>
            🐊 BOMBARDIRO CROCODILO SUPPORTS YOUR COMEBACK 🐊
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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#00FFFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    marginBottom: 30,
    transform: [{ rotate: '-1deg' }],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginVertical: 2,
  },
  form: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minHeight: 120,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 10,
    textAlign: 'right',
  },
  restoreButton: {
    backgroundColor: '#00FF00',
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 20,
    alignItems: 'center',
    transform: [{ rotate: '1deg' }],
    marginTop: 20,
  },
  restoringButton: {
    backgroundColor: '#FFFF00',
    transform: [{ rotate: '-1deg' }],
  },
  restoreButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  restoreButtonSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginTop: 5,
  },
  warningBox: {
    backgroundColor: '#FFFF00',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    marginBottom: 20,
    transform: [{ rotate: '1deg' }],
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginVertical: 2,
  },
  memeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 10,
  },
}); 