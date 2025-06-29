import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS
} from '../theme';

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;
type QRScannerScreenRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;

type Props = {
  navigation: QRScannerScreenNavigationProp;
  route: QRScannerScreenRouteProp;
};

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen({ navigation, route }: Props) {
  const { onScan, walletId, walletMnemonic } = route.params || {};
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate the scanned data
    // Updated regex to include both mainnet and testnet Bitcoin addresses
    const isValidBitcoinAddress = data.match(/^(bc1|tb1|[13mn2])[a-zA-HJ-NP-Z0-9]{25,87}$/);
    const isValidLightningInvoice = data.toLowerCase().startsWith('lnbc');
    
    if (isValidBitcoinAddress || isValidLightningInvoice) {
      // If called from Lightning screen and it's a Lightning invoice, navigate to Lightning with the invoice
      if (walletId && walletMnemonic && isValidLightningInvoice) {
        navigation.navigate('Lightning', { 
          walletId, 
          walletMnemonic,
          scannedInvoice: data 
        });
      }
      // If called with onScan callback, use the callback
      else if (onScan) {
        onScan(data);
        navigation.goBack();
      }
      // Otherwise just go back
      else {
        navigation.goBack();
      }
    } else {
      Alert.alert(
        'Invalid QR Code',
        'Please scan a Bitcoin address or Lightning invoice',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>📷</Text>
          <Text style={styles.errorTitle}>Camera Access Needed</Text>
          <Text style={styles.errorSubtitle}>Enable camera to scan QR codes</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Scan Area Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Point camera at QR code
          </Text>
          <Text style={styles.instructionSubtext}>
            Bitcoin address or Lightning invoice
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingTop: 60,
    paddingBottom: SPACING.LG,
    backgroundColor: 'black',
  },
  
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  
  placeholder: {
    width: 40,
  },
  
  camera: {
    flex: 1,
  },
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  
  instructionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  errorText: {
    fontSize: 48,
    marginBottom: SPACING.LG,
  },
  
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    paddingHorizontal: SPACING.LG,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 