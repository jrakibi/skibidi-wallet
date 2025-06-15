import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Animated,
  Share,
  Clipboard,
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

export default function ReceiveScreen({ navigation, route }: Props) {
  const { address } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const copyToClipboard = async () => {
    Clipboard.setString(address);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        message: address,
        title: 'Bitcoin Address',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 10)}`;
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
        <Text style={styles.headerTitle}>Receive Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* Address Display */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            
            <View style={styles.addressCard}>
              <Text style={styles.addressText}>
                {truncateAddress(address)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyToClipboard}
            >
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={shareAddress}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Share this address to receive Bitcoin
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={address}
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
  
  addressContainer: {
    marginBottom: SPACING.XL,
  },
  
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  addressCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  
  addressText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: 'monospace',
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