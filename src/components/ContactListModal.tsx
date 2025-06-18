import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import ContactCard, { Contact } from './ContactCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import AddContactModal from './AddContactModal';

const { width, height } = Dimensions.get('window');

interface ContactListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

// Sample contacts data - in a real app, this would come from storage
const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'Satoshi',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    imageSource: require('../../assets/brainrot/brainrot1.png'),
    isFavorite: true,
  },
];

export default function ContactListModal({ 
  visible, 
  onClose, 
  onSelectContact, 
  selectedContactId 
}: ContactListModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(sampleContacts);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    let filtered = contacts;
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(contact => contact.isFavorite);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by favorites first, then alphabetically
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      return a.name.localeCompare(b.name);
    });
    
    setFilteredContacts(filtered);
  }, [searchQuery, showFavoritesOnly, contacts]);

  const handleSelectContact = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectContact(contact);
    onClose();
  };

  const handleAddNewContact = () => {
    setShowAddModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveNewContact = (newContact: Omit<Contact, 'id'>) => {
    const contactWithId: Contact = {
      ...newContact,
      id: (contacts.length + 1).toString(),
    };
    
    setContacts(prev => [...prev, contactWithId]);
    setShowAddModal(false);
  };

  const handleContactLongPress = (contact: Contact) => {
    Alert.alert(
      contact.name,
      `Address: ${contact.address}`,
      [
        { text: 'Copy Address', onPress: () => console.log('Copy address') },
        { text: 'Edit Contact', onPress: () => console.log('Edit contact') },
        { 
          text: 'Delete Contact', 
          style: 'destructive', 
          onPress: () => handleDeleteContact(contact.id) 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setContacts(prev => prev.filter(contact => contact.id !== contactId));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        },
      ]
    );
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
        
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable}
            onPress={closeModal}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Select Contact</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons 
                  name="close" 
                  size={16} 
                  color={COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  !showFavoritesOnly && styles.filterButtonActive
                ]}
                onPress={() => setShowFavoritesOnly(false)}
              >
                <Text style={[
                  styles.filterButtonText,
                  !showFavoritesOnly && styles.filterButtonTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  showFavoritesOnly && styles.filterButtonActive
                ]}
                onPress={() => setShowFavoritesOnly(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[
                    styles.filterButtonText,
                    showFavoritesOnly && styles.filterButtonTextActive
                  ]}>
                    Favorites
                  </Text>
                  <Ionicons 
                    name="star" 
                    size={12} 
                    color={showFavoritesOnly ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY}
                    style={{ marginLeft: 4 }}
                                    />
                </View>
              </TouchableOpacity>
            </View>

            {/* Contacts List */}
            <ScrollView 
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contactsListContent}
            >
              {filteredContacts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="search-outline" 
                    size={48} 
                    color={COLORS.TEXT_TERTIARY}
                    style={{ marginBottom: SPACING.LG }}
                  />
                  <Text style={styles.emptyStateTitle}>No contacts found</Text>
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'Try a different search term' : 'Add your first contact to get started'}
                  </Text>
                </View>
              ) : (
                filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onPress={handleSelectContact}
                    onDelete={handleDeleteContact}
                    onLongPress={handleContactLongPress}
                    isSelected={contact.id === selectedContactId}
                  />
                ))
              )}
            </ScrollView>

            {/* Add New Contact Button */}
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewContact}
              >
                <Ionicons 
                  name="add-outline" 
                  size={20} 
                  color={COLORS.TEXT_SECONDARY}
                  style={{ marginRight: SPACING.SM }}
                />
                <Text style={styles.addButtonText}>Add New Contact</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Add Contact Modal */}
        <AddContactModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddContact={handleSaveNewContact}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: RADIUS.XL,
    borderTopRightRadius: RADIUS.XL,
    overflow: 'hidden',
  },
  
  safeArea: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  
  headerSubtitle: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  closeButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  
  searchContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  
  searchInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.MD,
    gap: SPACING.SM,
  },
  
  filterButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  filterButtonActive: {
    backgroundColor: '#FF6B00', // Orange accent
    borderColor: '#FF6B00',
  },
  
  filterButtonText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  
  filterButtonTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  
  contactsList: {
    flex: 1,
  },
  
  contactsListContent: {
    paddingBottom: SPACING.LG,
  },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL,
  },
  

  
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  
  emptyStateText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SPACING.XL,
  },
  
  addButtonContainer: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.LG,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    borderStyle: 'dashed',
  },
  

  
  addButtonText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
}); 