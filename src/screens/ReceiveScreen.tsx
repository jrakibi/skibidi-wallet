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
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  GRADIENTS,
  TYPOGRAPHY
} from '../theme';

const { width } = Dimensions.get('window');

type ReceiveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Receive'>;
type ReceiveScreenRouteProp = RouteProp<RootStackParamList, 'Receive'>;

type Props = {
  navigation: ReceiveScreenNavigationProp;
  route: ReceiveScreenRouteProp;
};

export default function ReceiveScreen({ navigation, route }: Props) {
  const { address } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [qrGlowAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Staggered animations for better visual impact
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Enhanced QR glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(qrGlowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(qrGlowAnim, {
          toValue: 0.3,
          duration: 2500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const copyToClipboard = async () => {
    Clipboard.setString(address);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '✅ Copied!', 
      'Address copied to clipboard',
      [{ text: 'OK', style: 'default' }],
      { userInterfaceStyle: 'dark' }
    );
  };

  const shareAddress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `My Bitcoin Address: ${address}`,
        title: 'Bitcoin Address - Skibidi Wallet',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Receive Bitcoin</Text>
          <Text style={styles.headerSubtitle}>Share your address</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
          
          {/* Enhanced QR Code Section */}
          <View style={styles.qrSection}>
            <Animated.View style={[
              styles.qrOuterContainer,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}>
              <Animated.View style={[
                styles.qrContainer,
                {
                  shadowOpacity: qrGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.8]
                  }),
                  shadowRadius: qrGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 25]
                  }),
                }
              ]}>
                <View style={styles.qrInnerContainer}>
                  <QRCode
                    value={address}
                    size={180}
                    color={COLORS.TEXT_PRIMARY}
                    backgroundColor={COLORS.SURFACE}
                    logoBackgroundColor="transparent"
                  />
                </View>
              </Animated.View>
              
              {/* Decorative corners */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </Animated.View>
          </View>

          {/* Enhanced Address & Actions */}
          <View style={styles.addressSection}>
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Your Bitcoin Address</Text>
              <View style={styles.addressBox}>
                <Text style={styles.addressText}>{address}</Text>
              </View>
            </View>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonIcon}>⧉</Text>
                  <Text style={styles.buttonText}>Copy Address</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonIcon}>↗</Text>
                  <Text style={styles.buttonText}>Share</Text>
                </View>
              </TouchableOpacity>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  backButtonText: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  
  headerCenter: {
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  headerSubtitle: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  
  placeholder: {
    width: 44,
  },
  
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
    alignItems: 'center',
  },
  
  qrSection: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  
  qrOuterContainer: {
    position: 'relative',
    padding: SPACING.MD,
  },
  
  qrContainer: {
    padding: SPACING.XL,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.XL,
    borderWidth: 2,
    borderColor: COLORS.BORDER_MEDIUM,
    shadowColor: COLORS.BITCOIN_ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 12,
  },
  
  qrInnerContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
  },
  
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.BITCOIN_ORANGE,
    borderWidth: 3,
  },
  
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  
  addressSection: {
    width: '100%',
    marginBottom: SPACING.XXL,
  },
  
  addressContainer: {
    marginBottom: SPACING.XL,
  },
  
  addressLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  
  addressBox: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  
  addressText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
    justifyContent: 'center',
  },
  
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    maxWidth: 160,
  },

  buttonContainer: {
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  
  buttonIcon: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  
  buttonText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
}); 