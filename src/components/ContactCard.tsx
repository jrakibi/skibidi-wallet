import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface Contact {
  id: string;
  name: string;
  address: string;
  imageSource: any; // For require() images
  isFavorite?: boolean;
}

interface ContactCardProps {
  contact: Contact;
  onPress: (contact: Contact) => void;
  onLongPress?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  isSelected?: boolean;
}

export default function ContactCard({ 
  contact, 
  onPress, 
  onLongPress, 
  onDelete,
  isSelected = false 
}: ContactCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(contact);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(contact);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.contactHeader}>
          <View style={styles.imageContainer}>
            <Image 
              source={contact.imageSource} 
              style={styles.contactImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text style={styles.contactAddress} numberOfLines={1}>
              {truncateAddress(contact.address)}
            </Text>
          </View>
          <View style={styles.contactActions}>
            {contact.isFavorite && (
              <View style={styles.favoriteIndicator}>
                <Ionicons 
                  name="star" 
                  size={16} 
                  color="#FFD700" 
                />
              </View>
            )}
            {onDelete && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    'Delete Contact?',
                    `Remove ${contact.name} from your contacts?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive', 
                        onPress: () => onDelete(contact.id)
                      },
                    ]
                  );
                }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={14} 
                  color={COLORS.TEXT_TERTIARY} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      {isSelected && (
        <View style={styles.selectedOverlay}>
          <Ionicons 
            name="checkmark" 
            size={14} 
            color={COLORS.TEXT_PRIMARY} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
}



const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
    overflow: 'hidden',
  },
  
  cardSelected: {
    borderColor: '#FF6B00', // Orange accent
    borderWidth: 2,
    backgroundColor: '#FF6B00' + '10', // Orange with transparency
  },
  
  cardContent: {
    padding: SPACING.LG,
  },
  
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    overflow: 'hidden',
  },
  
  contactImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.MD,
  },
  
  contactInfo: {
    flex: 1,
  },
  
  contactName: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  
  contactAddress: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    fontFamily: 'monospace',
  },
  
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.SM,
  },
  
  favoriteIndicator: {
    marginRight: SPACING.XS,
  },
  
  deleteButton: {
    padding: SPACING.XS,
    borderRadius: RADIUS.SM,
    backgroundColor: COLORS.SURFACE,
  },
  
  favoriteIcon: {
    fontSize: 16,
    color: '#FFD700',
  },
  

  
  selectedOverlay: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00', // Orange accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  selectedCheck: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
}); 