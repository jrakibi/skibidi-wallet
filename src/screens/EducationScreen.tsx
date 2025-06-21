import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  TEXT_STYLES, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS 
} from '../theme';

const { width: screenWidth } = Dimensions.get('window');

type EducationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Education'>;

type Props = {
  navigation: EducationScreenNavigationProp;
};

interface Category {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: any;
  backgroundColor: string;
  buttonColor: string;
  route?: string;
  available: boolean;
}

export default function EducationScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  const categories: Category[] = [
    {
      id: '1',
      title: 'LEARN',
      subtitle: 'Bitcoin',
      description: 'Essential concepts and fundamentals',
      image: require('../../assets/learn/bitcoin.png'),
      backgroundColor: COLORS.SURFACE_ELEVATED,
      buttonColor: COLORS.BITCOIN_ORANGE,
      route: 'BitcoinLessons',
      available: true
    },
    {
      id: '2',
      title: 'DISCOVER',
      subtitle: 'Lightning',
      description: 'Instant payment networks',
      image: require('../../assets/learn/lightning.png'),
      backgroundColor: COLORS.SURFACE,
      buttonColor: COLORS.TEXT_TERTIARY,
      route: 'LightningLessons',
      available: false
    },
    {
      id: '3',
      title: 'CHAT',
      subtitle: 'AI Tutor',
      description: 'Get help with coding challenges',
      image: require('../../assets/learn/AI.png'),
      backgroundColor: COLORS.SURFACE,
      buttonColor: COLORS.TEXT_TERTIARY,
      route: 'SkibidiAI',
      available: false
    }
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.MEDIUM,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleCategoryPress = (category: Category) => {
    if (category.available && category.id === '1') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Lesson', { lessonId: 'bitcoin-basics' });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLearnMorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://bitcoindevs.xyz/');
  };

  const renderCategoryCard = (category: Category, index: number) => {
    const isComingSoon = !category.available;
    
    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryCard,
          { backgroundColor: category.backgroundColor },
          category.id === '1' && styles.availableCard,
          isComingSoon && styles.comingSoonCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleCategoryPress(category)}
          activeOpacity={category.available ? 0.8 : 1}
          disabled={!category.available}
          style={styles.cardTouchable}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={[
                styles.imageContainer,
                category.id === '1' && styles.availableImageContainer,
                isComingSoon && styles.comingSoonImageContainer
              ]}>
                <Image 
                  source={category.image} 
                  style={[
                    styles.categoryImage,
                    isComingSoon && styles.comingSoonImage
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.cardRight}>
              <Text style={[
                styles.categoryTitle,
                isComingSoon && styles.comingSoonText
              ]}>
                {category.title}
              </Text>
              <Text style={[
                styles.categorySubtitle,
                isComingSoon && styles.comingSoonText
              ]}>
                {category.subtitle}
              </Text>
              <Text style={[
                styles.categoryDescription,
                isComingSoon && styles.comingSoonDescription
              ]}>
                {category.description}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.playButton, 
            { backgroundColor: category.buttonColor },
            isComingSoon && styles.comingSoonButton
          ]}>
            {isComingSoon ? (
              <View style={styles.comingSoonBadge}>
                <Ionicons name="time-outline" size={16} color={COLORS.TEXT_TERTIARY} />
                <Text style={styles.comingSoonBadgeText}>SOON</Text>
              </View>
            ) : (
              <Ionicons name="play" size={20} color={COLORS.TEXT_PRIMARY} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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
        <Text style={styles.headerTitle}>Learn</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}]
            }
          ]}
        >
          <Text style={styles.heroTitle}>BDP Academy</Text>
          <Text style={styles.heroSubtitle}>
            From basics to advanced concepts, learn bitcoin development through hands-on interactive lessons.
          </Text>
        </Animated.View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <Animated.View
              key={category.id}
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50 + (index * 20), 0]
                  })
                }]
              }}
            >
              {renderCategoryCard(category, index)}
            </Animated.View>
          ))}
        </View>

        {/* Learn More Section */}
        <Animated.View 
          style={[
            styles.learnMoreSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0]
              })}]
            }
          ]}
        >
          <Text style={styles.learnMoreTitle}>Want to level up?</Text>
          <Text style={styles.learnMoreDescription}>
            Access comprehensive bitcoin development courses, contribute to real projects, and join a community of builders.
          </Text>
          <TouchableOpacity 
            style={styles.learnMoreButton}
            onPress={handleLearnMorePress}
          >
            <View style={styles.learnMoreButtonContent}>
              <Text style={styles.learnMoreButtonText}>Advanced Resources</Text>
              <View style={styles.learnMoreButtonBadge}>
                <Text style={styles.learnMoreButtonBadgeText}>FREE</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.BITCOIN_ORANGE} />
          </TouchableOpacity>
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
    paddingTop: SPACING.XXL,
    paddingBottom: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  settingsIcon: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  
  // Hero Section
  heroSection: {
    marginBottom: SPACING.XXL * 1.5,
    paddingHorizontal: SPACING.SM,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 42,
    marginBottom: SPACING.MD,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  
  // Categories
  categoriesContainer: {
    marginBottom: SPACING.XXL,
    gap: SPACING.LG,
  },
  categoryCard: {
    borderRadius: 24,
    minHeight: 140,
    position: 'relative',
    ...SHADOWS.SUBTLE,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
    padding: SPACING.LG,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardLeft: {
    marginRight: SPACING.LG,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  availableImageContainer: {
    backgroundColor: COLORS.BITCOIN_ORANGE + '15',
    borderWidth: 2,
    borderColor: COLORS.BITCOIN_ORANGE + '30',
  },
  comingSoonImageContainer: {
    backgroundColor: COLORS.SURFACE,
    opacity: 0.6,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  comingSoonImage: {
    opacity: 0.5,
  },
  cardRight: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  categorySubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  categoryDescription: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    lineHeight: 20,
  },
  playButton: {
    position: 'absolute',
    right: SPACING.LG,
    bottom: SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
    elevation: 6,
  },
  playButtonIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  availableCard: {
    borderColor: COLORS.BITCOIN_ORANGE + '40',
    borderWidth: 2,
    backgroundColor: COLORS.SURFACE_ELEVATED,
  },
  comingSoonCard: {
    opacity: 0.7,
    backgroundColor: COLORS.SURFACE,
  },
  comingSoonText: {
    color: COLORS.TEXT_TERTIARY,
  },
  comingSoonDescription: {
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
    fontSize: 14,
  },
  comingSoonButton: {
    backgroundColor: COLORS.SURFACE + '80',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.TEXT_TERTIARY + '15',
    gap: 4,
  },
  comingSoonBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.TEXT_TERTIARY,
    letterSpacing: 0.5,
  },
  
  // Learn More Section
  learnMoreSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
    padding: SPACING.XL,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  learnMoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    letterSpacing: -0.3,
  },
  learnMoreDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
    fontWeight: '400',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BITCOIN_ORANGE + '15',
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BITCOIN_ORANGE + '30',
  },
  learnMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  learnMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BITCOIN_ORANGE,
    marginRight: SPACING.SM,
  },
  learnMoreButtonBadge: {
    backgroundColor: COLORS.BITCOIN_ORANGE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  learnMoreButtonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_INVERSE,
    letterSpacing: 0.5,
  },
  learnMoreButtonIcon: {
    fontSize: 16,
    color: COLORS.BITCOIN_ORANGE,
    fontWeight: '600',
  },
}); 