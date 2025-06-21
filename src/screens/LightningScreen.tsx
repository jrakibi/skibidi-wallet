import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../../App';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { getApiUrl } from '../config';

type LightningScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lightning'>;
type LightningScreenRouteProp = RouteProp<RootStackParamList, 'Lightning'>;

interface Props {
  navigation: LightningScreenNavigationProp;
  route: LightningScreenRouteProp;
}

interface LightningInvoice {
  bolt11: string;
  payment_hash: string;
  amount_msats: number | null;
  description: string;
  expiry_time: number;
  created_at: string;
}

interface LightningPayment {
  payment_hash: string;
  amount_msats: number;
  status: 'Pending' | 'Succeeded' | 'Failed';
  created_at: string;
  bolt11?: string;
}

interface NodeInfo {
  node_id: string;
  network: string;
  implementation: string;
}

export default function LightningScreen({ navigation, route }: Props) {
  const { walletId, walletMnemonic, scannedInvoice } = route.params || {};
  
  // PREVIEW MODE - Lightning is in development
  const [isPreviewMode] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'receive' | 'send' | 'history'>(scannedInvoice ? 'send' : 'receive');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Receive tab state
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<LightningInvoice | null>(null);
  
  // Send tab state
  const [paymentInvoice, setPaymentInvoice] = useState('');
  const [paymentResult, setPaymentResult] = useState<LightningPayment | null>(null);
  
  // History tab state
  const [invoices, setInvoices] = useState<LightningInvoice[]>([]);
  const [payments, setPayments] = useState<LightningPayment[]>([]);
  
  // Node info
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);

  useEffect(() => {
    loadNodeInfo();
    loadHistory();
    
    // If we have a scanned invoice, populate the payment field
    if (scannedInvoice) {
      setPaymentInvoice(scannedInvoice);
    }

    // Auto-refresh payment status every 3 seconds for demo
    const interval = setInterval(() => {
      loadHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [scannedInvoice]);

  const loadNodeInfo = async () => {
    try {
      const response = await fetch(getApiUrl('/lightning/node-info'));
      const result = await response.json();
      if (result.success) {
        setNodeInfo(result.data);
      }
    } catch (error) {
      console.error('Error loading node info:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const [invoicesResponse, paymentsResponse] = await Promise.all([
        fetch(getApiUrl('/lightning/invoices')),
        fetch(getApiUrl('/lightning/payments')),
      ]);

      const invoicesResult = await invoicesResponse.json();
      const paymentsResult = await paymentsResponse.json();

      if (invoicesResult.success) {
        setInvoices(invoicesResult.data || []);
      }
      if (paymentsResult.success) {
        setPayments(paymentsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const createInvoice = async () => {
    if (isPreviewMode) {
      setShowPreviewModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (!invoiceDescription.trim()) {
      Alert.alert('Required', 'Please enter a description');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(getApiUrl('/lightning/create-invoice'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_msats: invoiceAmount ? parseInt(invoiceAmount) * 1000 : null,
          description: invoiceDescription,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedInvoice(result.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setInvoiceAmount('');
        setInvoiceDescription('');
        // Refresh history to show the new invoice
        loadHistory();
      } else {
        Alert.alert('Error', result.error || 'Failed to create invoice');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const payInvoice = async () => {
    if (isPreviewMode) {
      setShowPreviewModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (!paymentInvoice.trim()) {
      Alert.alert('Required', 'Please enter a Lightning invoice');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(getApiUrl('/lightning/pay-invoice'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bolt11: paymentInvoice.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPaymentResult(result.data);
        if (result.data.status === 'Succeeded') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (result.data.status === 'Failed') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setPaymentInvoice('');
        loadHistory();
      } else {
        Alert.alert('Error', result.error || 'Failed to pay invoice');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const shareInvoice = async (invoice: LightningInvoice) => {
    try {
      await Share.share({
        message: `⚡ Lightning Invoice\n\n${invoice.description}\n\nAmount: ${invoice.amount_msats ? `${invoice.amount_msats / 1000} sats` : 'Any amount'}\n\n${invoice.bolt11}`,
        title: 'Lightning Invoice',
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const scanQR = () => {
    if (isPreviewMode) {
      setShowPreviewModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    navigation.navigate('QRScanner', { walletId, walletMnemonic });
  };

  const formatAmount = (amountMsats: number | null) => {
    if (!amountMsats) return 'Any amount';
    return `${(amountMsats / 1000).toLocaleString()} sats`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Succeeded': return COLORS.SUCCESS;
      case 'Failed': return COLORS.ERROR;
      case 'Pending': return COLORS.WARNING;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  return (
    <>
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lightning</Text>
        <View style={styles.headerRight}>
          {isPreviewMode && (
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>PREVIEW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <View style={styles.previewBannerContent}>
            <Ionicons name="eye-outline" size={20} color={COLORS.BITCOIN_ORANGE} />
            <Text style={styles.previewBannerText}>
              Lightning Network Preview - Coming Soon
            </Text>
          </View>
          <Text style={styles.previewBannerSubtext}>
            Explore the interface while we finish development
          </Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receive' && styles.activeTab]}
          onPress={() => setActiveTab('receive')}
        >
          <Ionicons name="qr-code" size={20} color={activeTab === 'receive' ? '#FFFFFF' : COLORS.TEXT_SECONDARY} />
          <Text style={[styles.tabText, activeTab === 'receive' && styles.activeTabText]}>Receive</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Ionicons name="flash" size={20} color={activeTab === 'send' ? '#FFFFFF' : COLORS.TEXT_SECONDARY} />
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>Send</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time" size={20} color={activeTab === 'history' ? '#FFFFFF' : COLORS.TEXT_SECONDARY} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'receive' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Create Lightning Invoice</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount (sats) - Optional</Text>
            <TextInput
              style={styles.input}
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
              placeholder="Leave empty for any amount"
              keyboardType="numeric"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.input}
              value={invoiceDescription}
              onChangeText={setInvoiceDescription}
              placeholder="What is this payment for?"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={createInvoice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Create Invoice</Text>
              </>
            )}
          </TouchableOpacity>

          {generatedInvoice && (
            <View style={styles.invoiceContainer}>
              <Text style={styles.invoiceTitle}>Invoice Created! ⚡</Text>
              
              <View style={styles.qrContainer}>
                <QRCode
                  value={generatedInvoice.bolt11}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>

              {/* Debug info */}
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>BOLT11: {generatedInvoice.bolt11.substring(0, 50)}...</Text>
              </View>

              <View style={styles.invoiceDetails}>
                <Text style={styles.invoiceAmount}>{formatAmount(generatedInvoice.amount_msats)}</Text>
                <Text style={styles.invoiceDescription}>{generatedInvoice.description}</Text>
                <Text style={styles.invoiceHash}>Payment Hash: {generatedInvoice.payment_hash.substring(0, 16)}...</Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareInvoice(generatedInvoice)}
              >
                <Ionicons name="share" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.shareButtonText}>Share Invoice</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {activeTab === 'send' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Pay Lightning Invoice</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Lightning Invoice (BOLT11) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={paymentInvoice}
              onChangeText={setPaymentInvoice}
              placeholder="lnbc..."
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={scanQR}
            >
              <Ionicons name="qr-code-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.buttonSecondaryText}>Scan QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={payInvoice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Pay</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {paymentResult && (
            <View style={styles.paymentResult}>
              <Text style={[styles.paymentStatus, { color: getStatusColor(paymentResult.status) }]}>
                Payment {paymentResult.status}
              </Text>
              <Text style={styles.paymentAmount}>{formatAmount(paymentResult.amount_msats)}</Text>
              <Text style={styles.paymentHash}>
                Payment Hash: {paymentResult.payment_hash.substring(0, 16)}...
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Lightning History</Text>
          
          {/* Invoices */}
          {invoices.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Invoices Created</Text>
              {invoices.map((invoice, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Ionicons name="qr-code" size={20} color={COLORS.SUCCESS} />
                    <Text style={styles.historyItemAmount}>{formatAmount(invoice.amount_msats)}</Text>
                  </View>
                  <Text style={styles.historyItemDescription}>{invoice.description}</Text>
                  <Text style={styles.historyItemDate}>{formatDate(invoice.created_at)}</Text>
                </View>
              ))}
            </>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Payments Made</Text>
              {payments.map((payment, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Ionicons name="flash" size={20} color={getStatusColor(payment.status)} />
                    <Text style={styles.historyItemAmount}>{formatAmount(payment.amount_msats)}</Text>
                    <Text style={[styles.historyItemStatus, { color: getStatusColor(payment.status) }]}>
                      {payment.status}
                    </Text>
                  </View>
                  <Text style={styles.historyItemDate}>{formatDate(payment.created_at)}</Text>
                </View>
              ))}
            </>
          )}

          {invoices.length === 0 && payments.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flash-off" size={48} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyStateText}>No Lightning transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Create an invoice or make a payment to get started</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>

    {/* Preview Mode Modal */}
    <Modal
      visible={showPreviewModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="construct-outline" size={32} color={COLORS.BITCOIN_ORANGE} />
            <Text style={styles.modalTitle}>Lightning Network</Text>
            <Text style={styles.modalSubtitle}>In Development</Text>
          </View>
          
          <Text style={styles.modalDescription}>
            We're building the Lightning Network integration for instant Bitcoin payments. 
            This preview shows the interface design, but functionality is still being developed.
          </Text>
          
          <View style={styles.modalFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Instant Bitcoin payments</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Low transaction fees</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>QR code invoice system</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Real-time payment status</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowPreviewModal(false)}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
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
    paddingVertical: SPACING.LG,
    paddingTop: SPACING.XXL,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  networkBadge: {
    backgroundColor: COLORS.SUCCESS,
    color: '#FFFFFF',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.XS,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.SM,
    gap: SPACING.SM,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  subsectionTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  inputContainer: {
    marginBottom: SPACING.MD,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: RADIUS.MD,
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  buttonSecondary: {
    backgroundColor: COLORS.SURFACE,
    flex: 1,
    marginRight: SPACING.SM,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  buttonSecondaryText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  invoiceTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.SUCCESS,
    marginBottom: SPACING.LG,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginBottom: SPACING.LG,
  },
  invoiceDetails: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  invoiceAmount: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.SUCCESS,
    marginBottom: SPACING.SM,
  },
  invoiceDescription: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  invoiceHash: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    gap: SPACING.SM,
  },
  shareButtonText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  paymentResult: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  paymentStatus: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    marginBottom: SPACING.MD,
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  paymentHash: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  historyItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    gap: SPACING.SM,
  },
  historyItemAmount: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  historyItemStatus: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  historyItemDescription: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  historyItemDate: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
    padding: SPACING.SM,
    borderRadius: RADIUS.SM,
    marginBottom: SPACING.MD,
  },
  debugText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  previewBadge: {
    backgroundColor: COLORS.BITCOIN_ORANGE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  previewBadgeText: {
    fontSize: TYPOGRAPHY.SMALL - 2,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  previewBanner: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
    margin: SPACING.LG,
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.BITCOIN_ORANGE,
  },
  previewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    gap: SPACING.SM,
  },
  previewBannerText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  previewBannerSubtext: {
    fontSize: TYPOGRAPHY.BODY - 2,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.SM,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.BITCOIN_ORANGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  modalFeatures: {
    marginBottom: SPACING.XL,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  featureBullet: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.BITCOIN_ORANGE,
    marginRight: SPACING.SM,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  featureText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  modalButton: {
    backgroundColor: COLORS.BITCOIN_ORANGE,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
}); 