import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Clipboard,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type ReceiveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Receive'>;
type ReceiveScreenRouteProp = RouteProp<RootStackParamList, 'Receive'>;

type Props = {
  navigation: ReceiveScreenNavigationProp;
  route: ReceiveScreenRouteProp;
};

export default function ReceiveScreen({ navigation, route }: Props) {
  const { address } = route.params;
  const [qrSize] = useState(250);

  const copyAddress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Clipboard.setString(address);
    Alert.alert('Copied! 📋', 'Address copied to clipboard - it\'s giving share vibes! 💀');
  };

  const shareAddress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Send Bitcoin to this address: ${address}`,
        title: 'My Skibidi Bitcoin Address',
      });
    } catch (error) {
      Alert.alert('Share Failed 💀', 'Couldn\'t share address fr fr');
    }
  };

  return (
    <LinearGradient colors={['#00FF00', '#33FF33', '#66FF66']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← BACK TO STASH</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>💰 GET THAT BAG 💰</Text>
          <Text style={styles.subtitle}>RECEIVE BITCOIN LIKE A BOSS</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={address}
              size={qrSize}
              color="#000"
              backgroundColor="#FFF"
              logoSize={30}
              logoMargin={2}
              logoBorderRadius={15}
            />
          </View>
          <Text style={styles.qrLabel}>SCAN THIS QR CODE</Text>
          <Text style={styles.qrSubtext}>OR COPY THE ADDRESS BELOW</Text>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>YOUR BITCOIN ADDRESS:</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={copyAddress}>
            <Text style={styles.actionButtonText}>📋 COPY ADDRESS</Text>
            <Text style={styles.actionButtonSubtext}>CTRL+C THAT ADDY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={shareAddress}>
            <Text style={styles.actionButtonText}>📤 SHARE ADDRESS</Text>
            <Text style={styles.actionButtonSubtext}>SPREAD THE WEALTH</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 HOW TO RECEIVE BITCOIN</Text>
          <Text style={styles.infoText}>1. Share this address or QR code</Text>
          <Text style={styles.infoText}>2. Someone sends Bitcoin to it</Text>
          <Text style={styles.infoText}>3. Wait for confirmations</Text>
          <Text style={styles.infoText}>4. Check your balance go brrrr 📈</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ IMPORTANT SAFETY TIPS ⚠️</Text>
          <Text style={styles.warningText}>• Only share this address publicly</Text>
          <Text style={styles.warningText}>• Never share your seed phrase</Text>
          <Text style={styles.warningText}>• This address is yours forever</Text>
          <Text style={styles.warningText}>• It's giving security main character energy</Text>
        </View>

        <Text style={styles.memeText}>
          🐊 BOMBARDIRO CROCODILO PROTECTS YOUR INCOMING SATS 🐊
        </Text>
        <Text style={styles.memeText}>
          ☕️ CAPPUCCINA BALLERINA APPROVES THIS ADDRESS ☕️
        </Text>
      </ScrollView>
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrWrapper: {
    backgroundColor: '#FFF',
    padding: 20,
    borderWidth: 4,
    borderColor: '#000',
    transform: [{ rotate: '-2deg' }],
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginTop: 15,
  },
  qrSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 5,
  },
  addressContainer: {
    marginBottom: 30,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  addressBox: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    transform: [{ rotate: '1deg' }],
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#FFFF00',
    transform: [{ rotate: '-1deg' }],
  },
  shareButton: {
    backgroundColor: '#FF00FF',
    transform: [{ rotate: '1deg' }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  actionButtonSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    marginTop: 3,
  },
  infoBox: {
    backgroundColor: '#00FFFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    marginBottom: 20,
    transform: [{ rotate: '1deg' }],
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
  warningBox: {
    backgroundColor: '#FFFF00',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    marginBottom: 20,
    transform: [{ rotate: '-1deg' }],
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
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
}); 