import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import ContactListModal from './ContactListModal';
import { Contact } from './ContactCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function ContactDemo() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openContactModal = () => {
    setShowContactModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Contact Cards Demo</Text>
        <Text style={styles.subtitle}>
          Tap the button below to see the contact selection UI in action
        </Text>

        {selectedContact ? (
          <View style={styles.selectedContactPreview}>
            <Text style={styles.previewLabel}>Selected Contact:</Text>
            <View style={styles.contactPreviewCard}>
              <Image 
                source={selectedContact.imageSource} 
                style={styles.contactPreviewImage}
                resizeMode="cover"
              />
              <View style={styles.contactPreviewDetails}>
                <Text style={styles.contactPreviewName}>{selectedContact.name}</Text>
                <Text style={styles.contactPreviewAddress}>
                  {selectedContact.address.substring(0, 8)}...{selectedContact.address.substring(selectedContact.address.length - 8)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSelectedContact(null)}
              >
                <Ionicons 
                  name="close" 
                  size={14} 
                  color={COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noContactSelected}>
            <Text style={styles.noContactText}>No contact selected</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.demoButton}
          onPress={openContactModal}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={COLORS.TEXT_PRIMARY}
            style={{ marginRight: SPACING.SM }}
          />
          <Text style={styles.demoButtonText}>Open Contact Selection</Text>
        </TouchableOpacity>

        <Text style={styles.features}>
          ✨ Features:{'\n'}
          • Contact cards with brainrot avatars{'\n'}
          • Search functionality{'\n'}
          • Favorites filtering{'\n'}
          • Minimalistic design{'\n'}
          • Long press for options{'\n'}
          • Smooth animations
        </Text>
      </View>

      <ContactListModal
        visible={showContactModal}
        onClose={closeContactModal}
        onSelectContact={handleSelectContact}
        selectedContactId={selectedContact?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  content: {
    flex: 1,
    padding: SPACING.LG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    paddingHorizontal: SPACING.LG,
  },
  
  selectedContactPreview: {
    width: '100%',
    marginBottom: SPACING.XL,
  },
  
  previewLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  
  contactPreviewCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contactPreviewImage: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.SM,
    marginRight: SPACING.MD,
  },
  
  contactPreviewDetails: {
    flex: 1,
  },
  
  contactPreviewName: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  
  contactPreviewAddress: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  clearButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  
  noContactSelected: {
    width: '100%',
    padding: SPACING.XL,
    marginBottom: SPACING.XL,
    alignItems: 'center',
  },
  
  noContactText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
  
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    marginBottom: SPACING.XL,
  },
  
  demoButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },
  
  demoButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  features: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.LG,
  },
}); 