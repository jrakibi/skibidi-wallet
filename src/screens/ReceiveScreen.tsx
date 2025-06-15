import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Clipboard,
  Share,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
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

type ReceiveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Receive'>;
type ReceiveScreenRouteProp = RouteProp<RootStackParamList, 'Receive'>;

type Props = {
  navigation: ReceiveScreenNavigationProp;
  route: ReceiveScreenRouteProp;
};

type ReceiveMode = 'onchain' | 'lightning';

export default function ReceiveScreen({ navigation, route }: Props) {
  const { address } = route.params;
  const [mode, setMode] = useState<ReceiveMode>('onchain');
  const [lightningInvoice, setLightningInvoice] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();

    if (mode === 'lightning') {
      generateLightningInvoice();
    }
  }, [mode]);

  const generateLightningInvoice = async () => {
    try {
      const response = await fetch('http://192.168.18.74:8080/lightning/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_msats: 1000000, // 1000 sats
          description: 'Skibidi Wallet Payment',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLightningInvoice(result.data.bolt11);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create Lightning invoice');
    }
  };

  const currentValue = mode === 'onchain' ? address : lightningInvoice;

  const copyToClipboard = async () => {
    if (!currentValue) return;
    
    await Clipboard.setString(currentValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', `${mode === 'onchain' ? 'Address' : 'Invoice'} copied to clipboard`);
  };

  const shareValue = async () => {
    if (!currentValue) return;

    try {
      await Share.share({
        message: currentValue,
        title: mode === 'onchain' ? 'Bitcoin Address' : 'Lightning Invoice',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const truncateValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 20) return value;
    return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
  };

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
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={styles.placeholder} />
      </View>

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

          {/* Address/Invoice Display */}
          <View style={styles.valueContainer}>
            <Text style={styles.valueLabel}>
              {mode === 'onchain' ? 'Address' : 'Invoice'}
            </Text>
            
            <View style={styles.valueCard}>
              <Text style={styles.valueText}>
                {truncateValue(currentValue)}
              </Text>
              {mode === 'lightning' && !lightningInvoice && (
                <Text style={styles.loadingText}>Generating...</Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyToClipboard}
              disabled={!currentValue}
            >
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={shareValue}
              disabled={!currentValue}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {mode === 'onchain' 
                ? 'Share this address to receive Bitcoin'
                : 'Share this invoice to receive instant payments'
              }
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={currentValue || address}
                  size={180}
                  color={COLORS.TEXT_PRIMARY}
                  backgroundColor={COLORS.SURFACE}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  
  valueContainer: {
    marginBottom: SPACING.XL,
  },
  
  valueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  valueCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  
  valueText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
  },
  
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  qrSection: {
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  
  qrCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  qrContainer: {
    padding: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    ...SHADOWS.SUBTLE,
  },
}); 