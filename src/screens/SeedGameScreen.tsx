import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS,
  TYPOGRAPHY,
  GRADIENTS
} from '../theme';

const { width, height } = Dimensions.get('window');

type SeedGameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SeedGame'>;

type Props = {
  navigation: SeedGameScreenNavigationProp;
  route: {
    params: {
      seedWords: string[];
      onComplete: (words: string[]) => void;
    };
  };
};

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
  wordRevealed: boolean;
  wordNumber: number;
}

const GAME_CONFIG = {
  GRAVITY: 0.3,        // Even slower falling for better control
  JUMP_FORCE: -6,      // Much smaller jumps - just gentle hops! (was -10)
  PIPE_WIDTH: 50,      // Slightly thinner obstacles (was 60)
  PIPE_GAP: 200,       // Much bigger gap to fly through (was 140)
  PIPE_SPEED: 2,       // Slower obstacle movement (was 3)
  BIRD_SIZE: 60,       // Bigger Bombardino for better visibility! (was 40)
  GROUND_HEIGHT: 80,
};

export default function SeedGameScreen({ navigation, route }: Props) {
  const { seedWords, onComplete } = route.params;
  
  // Game state
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'completed'>('waiting');
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const nextObstacleWordNumber = useRef(1);
  
  // Bird physics
  const birdY = useRef(new Animated.Value(height / 2)).current;
  const birdVelocity = useRef(0);
  const birdRotation = useRef(new Animated.Value(0)).current;
  
  // Game loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleIdCounter = useRef(0);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const [wordRevealAnim] = useState(new Animated.Value(0));

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

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setRevealedWords([]);
    setCurrentWordIndex(0);
    nextObstacleWordNumber.current = 1; // Reset obstacle word numbering
    birdVelocity.current = 0;
    
    // Reset bird position
    birdY.setValue(height / 2);
    birdRotation.setValue(0);
    
    // Create initial obstacles with good spacing
    const initialObstacles: Obstacle[] = [];
    for (let i = 0; i < 4; i++) {
      initialObstacles.push(createObstacle(width + i * 300)); // Good balance - not too close, not too far
    }
    setObstacles(initialObstacles);
    
    // Start game loop
    gameLoopRef.current = setInterval(updateGame, 16); // 60 FPS
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const createObstacle = (x: number): Obstacle => {
    const gapY = Math.random() * (height - GAME_CONFIG.PIPE_GAP - GAME_CONFIG.GROUND_HEIGHT - 100) + 50;
    const wordNumber = nextObstacleWordNumber.current;
    nextObstacleWordNumber.current++;
    
    return {
      id: obstacleIdCounter.current++,
      x,
      gapY,
      passed: false,
      wordRevealed: false,
      wordNumber, // Each obstacle gets its unique word number
    };
  };

  const updateGame = () => {
    // Update bird physics
    birdVelocity.current += GAME_CONFIG.GRAVITY;
    const newBirdY = (birdY as any)._value + birdVelocity.current;
    
    // Check ground collision with padding for forgiveness
    const groundPadding = 15; // More forgiving for bigger Bombardino
    if (newBirdY > height - GAME_CONFIG.GROUND_HEIGHT - GAME_CONFIG.BIRD_SIZE + groundPadding) {
      gameOver();
      return;
    }
    
    // Check ceiling collision with padding
    const ceilingPadding = 15; // More forgiving for bigger Bombardino
    if (newBirdY < -ceilingPadding) {
      gameOver();
      return;
    }
    
    birdY.setValue(newBirdY);
    
    // Update bird rotation based on velocity
    const rotation = Math.max(-30, Math.min(30, birdVelocity.current * 3));
    birdRotation.setValue(rotation);
    
    // Update obstacles
    setObstacles(prevObstacles => {
      const updatedObstacles = prevObstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - GAME_CONFIG.PIPE_SPEED,
      }));
      
      // Check collisions and scoring
      updatedObstacles.forEach(obstacle => {
        // Check if bird passed through obstacle
        if (!obstacle.passed && obstacle.x + GAME_CONFIG.PIPE_WIDTH < width / 2 - GAME_CONFIG.BIRD_SIZE / 2) {
          obstacle.passed = true;
          
          // Only reveal words if we haven't collected all of them yet
          if (!obstacle.wordRevealed && score < seedWords.length && obstacle.wordNumber <= seedWords.length) {
            obstacle.wordRevealed = true;
            revealWord(obstacle.wordNumber - 1); // Pass the correct word index
          }
        }
        
        // Check collision with generous padding for forgiveness
        const padding = 12; // Extra forgiving collision detection for bigger Bombardino
        const birdLeft = width / 2 - GAME_CONFIG.BIRD_SIZE / 2 + padding;
        const birdRight = width / 2 + GAME_CONFIG.BIRD_SIZE / 2 - padding;
        const birdTop = newBirdY + padding;
        const birdBottom = newBirdY + GAME_CONFIG.BIRD_SIZE - padding;
        
        if (
          obstacle.x < birdRight &&
          obstacle.x + GAME_CONFIG.PIPE_WIDTH > birdLeft &&
          (birdTop < obstacle.gapY + padding || birdBottom > obstacle.gapY + GAME_CONFIG.PIPE_GAP - padding)
        ) {
          gameOver();
          return;
        }
      });
      
      // Remove obstacles that have moved off screen and add new ones
      const filteredObstacles = updatedObstacles.filter(obstacle => obstacle.x > -GAME_CONFIG.PIPE_WIDTH);
      
      // Only add new obstacles if we haven't created obstacles for all words yet
      if (nextObstacleWordNumber.current <= seedWords.length) {
        const lastObstacle = filteredObstacles[filteredObstacles.length - 1];
        if (!lastObstacle || lastObstacle.x < width - 300) {
          filteredObstacles.push(createObstacle(width + 150)); // Good spacing between obstacles
        }
      }
      
      return filteredObstacles;
    });
  };

  const revealWord = (wordIndex: number) => {
    if (score < seedWords.length && wordIndex >= 0 && wordIndex < seedWords.length) {
      const newWord = seedWords[wordIndex];
      setRevealedWords(prev => [...prev, newWord]);
      setCurrentWordIndex(prev => prev + 1);
      setScore(prev => {
        const newScore = prev + 1;
        
        // Check if this was the last word and complete the game
        if (newScore >= seedWords.length) {
          setTimeout(() => {
            completeGame();
          }, 1000);
        }
        
        return newScore;
      });
      
      // Word reveal animation
      Animated.sequence([
        Animated.timing(wordRevealAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(wordRevealAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const jump = () => {
    if (gameState === 'playing') {
      birdVelocity.current = GAME_CONFIG.JUMP_FORCE;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const gameOver = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setGameState('waiting');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // No popup needed - just reset to waiting state
    // The user will see the start overlay again with instructions
  };

  const completeGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Go directly to seed review without popup
    onComplete(seedWords);
    navigation.goBack();
  };

  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      jump();
    }
  };

  const renderObstacle = (obstacle: Obstacle) => (
    <View key={obstacle.id}>
      {/* Top pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: obstacle.x,
            top: 0,
            height: obstacle.gapY,
          },
        ]}
      />
      {/* Bottom pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: obstacle.x,
            top: obstacle.gapY + GAME_CONFIG.PIPE_GAP,
            height: height - obstacle.gapY - GAME_CONFIG.PIPE_GAP - GAME_CONFIG.GROUND_HEIGHT,
          },
        ]}
      />
      {/* Word indicator */}
      {!obstacle.wordRevealed && obstacle.wordNumber <= seedWords.length && obstacle.x > width / 2 - 100 && obstacle.x < width / 2 + 100 && (
        <View
          style={[
            styles.wordIndicator,
            {
              left: obstacle.x + GAME_CONFIG.PIPE_WIDTH / 2 - 20,
              top: obstacle.gapY + GAME_CONFIG.PIPE_GAP / 2 - 20,
            },
          ]}
        >
          <Text style={styles.wordIndicatorText}>{obstacle.wordNumber}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onGestureEvent}>
        <Animated.View style={[styles.gameArea, { opacity: fadeAnim }]}>
          {/* Background gradient */}
          <LinearGradient
            colors={['#87CEEB', '#E0F6FF']}
            style={styles.background}
          />
          
          {/* Obstacles */}
          {obstacles.map(renderObstacle)}
          
          {/* Ground */}
          <View style={styles.ground} />
          
          {/* Bird (Bombardiro Crocodilo) */}
          <Animated.View
            style={[
              styles.bird,
              {
                transform: [
                  { translateY: birdY },
                  { rotate: birdRotation.interpolate({
                    inputRange: [-30, 30],
                    outputRange: ['-30deg', '30deg'],
                  }) },
                  { scaleX: -1 }, // Flip horizontally to face right
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/brainrot/brainrot4.png')}
              style={styles.birdImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* UI Overlay */}
          <View style={styles.uiOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Seed Hunt with Bombardiro</Text>
              <View style={styles.placeholder} />
            </View>
            
            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{score}/12 words</Text>
            </View>
            
            {/* Revealed words */}
            <View style={styles.wordsContainer}>
              {revealedWords.map((word, index) => (
                <View key={index} style={styles.revealedWord}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
            
            {/* Word reveal animation */}
            {revealedWords.length > 0 && (
              <Animated.View
                style={[
                  styles.wordRevealPopup,
                  {
                    opacity: wordRevealAnim,
                    transform: [{ scale: wordRevealAnim }],
                  },
                ]}
              >
                <Text style={styles.wordRevealText}>
                  Word {revealedWords.length}: {revealedWords[revealedWords.length - 1]}
                </Text>
              </Animated.View>
            )}
            
            {/* Start/Instructions */}
            {gameState === 'waiting' && (
              <Animated.View style={[styles.startOverlay, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.instructionsCard}>
                  <Image
                    source={require('../../assets/brainrot/brainrot4.png')}
                    style={[styles.instructionsBird, { transform: [{ scaleX: -1 }] }]}
                  />
                  <Text style={styles.instructionsTitle}>
                    Help Bombardiro Collect Your Seed Words!
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Tap anywhere to make Bombardiro fly smoothly
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Huge gaps and lots of space between obstacles
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Take your time - super relaxed gameplay
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Collect all 12 words at your own pace!
                  </Text>
                  
                  <TouchableOpacity style={styles.startButton} onPress={startGame}>
                    <LinearGradient
                      colors={GRADIENTS.PRIMARY}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>Let's Fly Together! 🚁✨</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: GAME_CONFIG.GROUND_HEIGHT,
  },
  
  pipe: {
    position: 'absolute',
    width: GAME_CONFIG.PIPE_WIDTH,
    backgroundColor: '#4CAF50',
    borderRadius: RADIUS.SM,
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GAME_CONFIG.GROUND_HEIGHT,
    backgroundColor: '#8BC34A',
    borderTopWidth: 3,
    borderTopColor: '#689F38',
  },
  
  bird: {
    position: 'absolute',
    left: width / 2 - GAME_CONFIG.BIRD_SIZE / 2,
    width: GAME_CONFIG.BIRD_SIZE,
    height: GAME_CONFIG.BIRD_SIZE,
  },
  
  birdImage: {
    width: '100%',
    height: '100%',
  },
  
  wordIndicator: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  wordIndicatorText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  backButtonText: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginHorizontal: SPACING.MD,
    ...SHADOWS.SUBTLE,
  },
  
  placeholder: {
    width: 40,
  },
  
  scoreContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SUBTLE,
  },
  
  scoreText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.PRIMARY,
  },
  
  wordsContainer: {
    position: 'absolute',
    top: 120,
    right: SPACING.MD,
    maxWidth: 120,
  },
  
  revealedWord: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
    padding: SPACING.XS,
    marginBottom: SPACING.XS,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  wordNumber: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginRight: SPACING.XS,
    minWidth: 20,
  },
  
  wordText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    flex: 1,
  },
  
  wordRevealPopup: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: RADIUS.LG,
    ...SHADOWS.SUBTLE,
  },
  
  wordRevealText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    textAlign: 'center',
  },
  
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  
  instructionsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  instructionsBird: {
    width: 80,
    height: 80,
    marginBottom: SPACING.LG,
  },
  
  instructionsTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  
  instructionsText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  
  startButton: {
    marginTop: SPACING.XL,
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
  },
  
  startButtonGradient: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  
  startButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  
  completionCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    ...SHADOWS.SUBTLE,
  },
  
  completionTitle: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  completionText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  
  completionBird: {
    width: 100,
    height: 100,
    marginBottom: SPACING.LG,
  },
  
  completionSubtext: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  
  continueButton: {
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    ...SHADOWS.SUBTLE,
  },
  
  continueButtonGradient: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  
  continueButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  // Complete seed phrase display styles
  completeSeedContainer: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginVertical: SPACING.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    ...SHADOWS.SUBTLE,
  },
  
  seedPhraseTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  
  completeSeedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  completeSeedWord: {
    width: '30%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
    padding: SPACING.SM,
    marginBottom: SPACING.XS,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  completeSeedNumber: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: SPACING.XS,
  },
  
  completeSeedText: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
}); 