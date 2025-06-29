import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  TYPOGRAPHY 
} from '../theme';

const { width, height } = Dimensions.get('window');

// Character progression images
const CHARACTER_IMAGES = [
  require('../../assets/restore-seedphrase/word1.png'),   // Just face
  require('../../assets/restore-seedphrase/word2.png'),   // Face + body
  require('../../assets/restore-seedphrase/word3.png'),   // + arms
  require('../../assets/restore-seedphrase/word4.png'),   // + legs
  require('../../assets/restore-seedphrase/word5.png'),   // + clothes
  require('../../assets/restore-seedphrase/word6.png'),   // + accessories
  require('../../assets/restore-seedphrase/word7.png'),   // + more details
  require('../../assets/restore-seedphrase/word8.png'),   // + background elements
  require('../../assets/restore-seedphrase/word9.png'),   // + more features
  require('../../assets/restore-seedphrase/word10.png'),  // Almost complete
  require('../../assets/restore-seedphrase/word11.png'),  // Nearly done
  require('../../assets/restore-seedphrase/word12.png'),  // Complete Skibidi character!
];

interface Props {
  mnemonic: string;
  onMnemonicChange: (text: string) => void;
  wordCount: number;
}

export default function GameifiedSeedInput({ mnemonic, onMnemonicChange, wordCount }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [characterAnim] = useState(new Animated.Value(0));
  const [wordAnimations] = useState(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  );
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Entrance animation
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
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate character when word count changes
    if (wordCount > 0 && wordCount <= 12) {
      Animated.spring(characterAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        // Reset for next animation
        characterAnim.setValue(0);
      });

      // Animate word indicators
      if (wordCount <= 12) {
        Animated.sequence([
          Animated.timing(wordAnimations[wordCount - 1], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(wordAnimations[wordCount - 1], {
            toValue: 0.8,
            tension: 200,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [wordCount]);

  const getCurrentCharacterImage = () => {
    if (wordCount === 0) return CHARACTER_IMAGES[0];
    if (wordCount > 12) return CHARACTER_IMAGES[11];
    return CHARACTER_IMAGES[wordCount - 1];
  };



  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Character and Progress Combined */}
      <View style={styles.topSection}>
        <View style={styles.characterContainer}>
          <Animated.View
            style={[
              styles.characterImageContainer,
              {
                transform: [
                  {
                    scale: characterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image 
              source={getCurrentCharacterImage()} 
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          <Text style={styles.characterTitle}>
            {wordCount === 0 ? "Let's Build!" : 
             wordCount === 12 ? "🎉 Complete!" :
             `${wordCount}/12`}
          </Text>
        </View>

        {/* Word Progress Indicators */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Progress</Text>
          <View style={styles.wordIndicators}>
            {Array.from({ length: 12 }, (_, index) => {
              const isCompleted = wordCount > index;
              const isCurrent = wordCount === index + 1;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.wordIndicator,
                    isCompleted && styles.wordIndicatorCompleted,
                    isCurrent && styles.wordIndicatorCurrent,
                    {
                      transform: [
                        {
                          scale: wordAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={[
                    styles.wordIndicatorText,
                    isCompleted && styles.wordIndicatorTextCompleted
                  ]}>
                    {index + 1}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          Enter your 12-word recovery phrase
        </Text>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          placeholder="Enter your words separated by spaces"
          placeholderTextColor={COLORS.TEXT_TERTIARY}
          value={mnemonic}
          onChangeText={onMnemonicChange}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
        />
        <View style={styles.wordCountContainer}>
          <Text style={[
            styles.wordCount,
            wordCount === 12 ? styles.wordCountValid : styles.wordCountInvalid
          ]}>
            {wordCount}/12 words
          </Text>
          {wordCount === 12 && (
            <Text style={styles.completeMessage}>
              ✨ Character Complete! Ready to restore! ✨
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
    gap: SPACING.MD,
  },
  characterContainer: {
    alignItems: 'center',
    flex: 1,
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
  },
  characterImageContainer: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    ...SHADOWS.SUBTLE,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  characterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderBottomLeftRadius: RADIUS.XL,
    borderBottomRightRadius: RADIUS.XL,
  },
  characterTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: SPACING.SM,
    fontWeight: 'bold',
  },

  progressTitle: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  wordIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    maxWidth: width * 0.4,
  },
  wordIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordIndicatorCompleted: {
    backgroundColor: COLORS.SUCCESS,
    borderColor: COLORS.SUCCESS,
  },
  wordIndicatorCurrent: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '20',
  },
  wordIndicatorText: {
    fontSize: TYPOGRAPHY.MICRO,
    color: COLORS.TEXT_TERTIARY,
    fontWeight: 'bold',
  },
  wordIndicatorTextCompleted: {
    color: COLORS.TEXT_PRIMARY,
  },
  inputSection: {
    marginTop: SPACING.SM,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontWeight: '600',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  wordCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  wordCount: {
    fontSize: TYPOGRAPHY.MICRO,
    fontWeight: '600',
  },
  wordCountValid: {
    color: COLORS.SUCCESS,
  },
  wordCountInvalid: {
    color: COLORS.TEXT_TERTIARY,
  },
  completeMessage: {
    fontSize: TYPOGRAPHY.MICRO,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
}); 