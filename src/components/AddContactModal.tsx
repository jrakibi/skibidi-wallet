import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from './ContactCard';

const { width, height } = Dimensions.get('window');

// Available brainrot images
const BRAINROT_IMAGES = [
  { id: 1, source: require('../../assets/brainrot/brainrot1.png') },
  { id: 2, source: require('../../assets/brainrot/brainrot2.png') },
  { id: 3, source: require('../../assets/brainrot/brainrot3.png') },
  { id: 4, source: require('../../assets/brainrot/brainrot4.png') },
  { id: 5, source: require('../../assets/brainrot/brainrot5.png') },
  { id: 6, source: require('../../assets/brainrot/brainrot6.png') },
];

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
}

export default function AddContactModal({ 
  visible, 
  onClose, 
  onAddContact 
}: AddContactModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedImageId, setSelectedImageId] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
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

  const handleClose = () => {
    // Reset form
    setName('');
    setAddress('');
    setSelectedImageId(1);
    setIsFavorite(false);
    onClose();
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a contact name');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Missing Address', 'Please enter a Bitcoin address');
      return;
    }

    const selectedImage = BRAINROT_IMAGES.find(img => img.id === selectedImageId);
    if (!selectedImage) return;

    const newContact: Omit<Contact, 'id'> = {
      name: name.trim(),
      address: address.trim(),
      imageSource: selectedImage.source,
      isFavorite,
    };

    onAddContact(newContact);
    handleClose();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const isValid = name.trim().length > 0 && address.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
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
            onPress={handleClose}
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
                <Text style={styles.headerTitle}>Add Contact</Text>
                <Text style={styles.headerSubtitle}>
                  Create a new contact with brainrot avatar
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons 
                  name="close" 
                  size={16} 
                  color={COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {/* Avatar Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose Avatar</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.avatarScrollView}
                  contentContainerStyle={styles.avatarScrollContent}
                >
                  {BRAINROT_IMAGES.map((image) => (
                    <TouchableOpacity
                      key={image.id}
                      style={[
                        styles.avatarOption,
                        selectedImageId === image.id && styles.avatarOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedImageId(image.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Image 
                        source={image.source} 
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                      {selectedImageId === image.id && (
                        <View style={styles.avatarSelectedOverlay}>
                          <Ionicons 
                            name="checkmark" 
                            size={16} 
                            color={COLORS.TEXT_PRIMARY} 
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Name Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter contact name"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  maxLength={30}
                  autoCapitalize="words"
                />
              </View>

              {/* Address Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bitcoin Address</Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter Bitcoin address"
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline={true}
                  numberOfLines={2}
                />
              </View>

              {/* Favorite Toggle */}
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.favoriteToggle}
                  onPress={() => {
                    setIsFavorite(!isFavorite);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.favoriteToggleLeft}>
                    <Ionicons 
                      name={isFavorite ? "star" : "star-outline"} 
                      size={20} 
                      color={isFavorite ? "#FFD700" : COLORS.TEXT_SECONDARY}
                    />
                    <Text style={styles.favoriteToggleText}>Add to Favorites</Text>
                  </View>
                  <View style={[
                    styles.toggleSwitch,
                    isFavorite && styles.toggleSwitchActive
                  ]}>
                    <View style={[
                      styles.toggleSwitchKnob,
                      isFavorite && styles.toggleSwitchKnobActive
                    ]} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !isValid && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={!isValid}
              >
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color={COLORS.TEXT_PRIMARY}
                  style={{ marginRight: SPACING.SM }}
                />
                <Text style={styles.saveButtonText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
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
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },
  
  contentContainer: {
    paddingBottom: SPACING.XL,
  },
  
  section: {
    marginBottom: SPACING.XL,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  avatarScrollView: {
    marginHorizontal: -SPACING.SM,
  },
  
  avatarScrollContent: {
    paddingHorizontal: SPACING.SM,
    gap: SPACING.MD,
  },
  
  avatarOption: {
    position: 'relative',
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  avatarOptionSelected: {
    borderColor: '#FF6B00',
  },
  
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.LG,
  },
  
  avatarSelectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.LG,
  },
  
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER_LIGHT,
    padding: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 36,
  },
  
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  favoriteToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  favoriteToggleText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.BORDER_LIGHT,
    padding: 2,
    justifyContent: 'center',
  },
  
  toggleSwitchActive: {
    backgroundColor: '#FF6B00',
  },
  
  toggleSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.TEXT_PRIMARY,
    transform: [{ translateX: 0 }],
  },
  
  toggleSwitchKnobActive: {
    transform: [{ translateX: 20 }],
  },
  
  buttonContainer: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: RADIUS.LG,
    paddingVertical: SPACING.LG,
    minHeight: 56,
  },
  
  saveButtonDisabled: {
    backgroundColor: COLORS.SURFACE,
    opacity: 0.5,
  },
  
  saveButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
}); 