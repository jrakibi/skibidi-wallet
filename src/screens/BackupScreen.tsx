import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Clipboard,
  Animated,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type BackupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Backup'>;
type BackupScreenRouteProp = RouteProp<RootStackParamList, 'Backup'>;

type Props = {
  navigation: BackupScreenNavigationProp;
  route: BackupScreenRouteProp;
};

type GameLevel = 'intro' | 'security' | 'memory' | 'sequence' | 'final' | 'completed';

export default function BackupScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const words = mnemonic.split(' ');
  
  // Game state
  const [currentLevel, setCurrentLevel] = useState<GameLevel>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [revealedWords, setRevealedWords] = useState<number[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<number[]>([]);
  const [showFinalPhrase, setShowFinalPhrase] = useState(false);
  
  // Animations
  const [scaleAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Shuffle words for sequence game
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, []);

  const celebrateSuccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Vibration.vibrate([0, 100, 50, 100]);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setScore(score + 100);
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const startSecurityLevel = () => {
    setCurrentLevel('security');
    celebrateSuccess();
  };

  const completeSecurityChallenge = (correct: boolean) => {
    if (correct) {
      celebrateSuccess();
      setCurrentLevel('memory');
      // Reveal first 4 words as reward
      setRevealedWords([0, 1, 2, 3]);
    } else {
      shakeAnimation();
      setLives(lives - 1);
      if (lives <= 1) {
        Alert.alert('💀 GAME OVER 💀', 'No cap, you gotta restart the security game!');
        setLives(3);
      }
    }
  };

  const completeMemoryChallenge = (wordIndex: number) => {
    if (!revealedWords.includes(wordIndex)) {
      const newRevealed = [...revealedWords, wordIndex];
      setRevealedWords(newRevealed);
      celebrateSuccess();
      
      if (newRevealed.length >= 8) {
        setCurrentLevel('sequence');
      }
    }
  };

  const handleSequenceSelection = (wordIndex: number) => {
    const newSequence = [...selectedSequence, wordIndex];
    setSelectedSequence(newSequence);
    
    // Check if correct so far
    if (words[newSequence.length - 1] === shuffledWords[wordIndex]) {
      celebrateSuccess();
      
      if (newSequence.length === 12) {
        setCurrentLevel('final');
      }
    } else {
      shakeAnimation();
      setSelectedSequence([]);
      setLives(lives - 1);
      if (lives <= 1) {
        Alert.alert('💀 SEQUENCE FAILED 💀', 'Bruh, gotta restart the sequence!');
        setLives(3);
      }
    }
  };

  const completeFinalChallenge = () => {
    setShowFinalPhrase(true);
    setCurrentLevel('completed');
    celebrateSuccess();
    Alert.alert('🎉 LEGENDARY STATUS ACHIEVED! 🎉', 
      `You're now a Seed Phrase Guardian! Score: ${score + 500}`);
  };

  const copySeedPhrase = () => {
    Clipboard.setString(mnemonic);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('📋 COPIED TO THE MATRIX! 📋', 'Your seed phrase is secured fr fr! 💀');
  };

  const renderIntroLevel = () => (
    <View style={styles.levelContainer}>
      <Animated.Text style={[styles.gameTitle, { transform: [{ scale: scaleAnim }] }]}>
        🎮 SEED PHRASE GUARDIAN GAME 🎮
      </Animated.Text>
      <Text style={styles.levelSubtitle}>PROTECT YOUR DIGITAL TREASURE!</Text>
      
      <View style={styles.gameStatsContainer}>
        <Text style={styles.gameStats}>🏆 Score: {score}</Text>
        <Text style={styles.gameStats}>❤️ Lives: {lives}</Text>
        <Text style={styles.gameStats}>🔥 Level: NOOB</Text>
      </View>

      <View style={styles.challengeBox}>
        <Text style={styles.challengeTitle}>🚀 MISSION BRIEFING 🚀</Text>
        <Text style={styles.challengeText}>• Complete 4 epic challenges</Text>
        <Text style={styles.challengeText}>• Prove you're worthy of the seed phrase</Text>
        <Text style={styles.challengeText}>• Become a legendary guardian</Text>
        <Text style={styles.challengeText}>• No cap, this is serious business! 💀</Text>
      </View>

      <TouchableOpacity style={styles.startGameButton} onPress={startSecurityLevel}>
        <Text style={styles.startGameButtonText}>🎯 START THE CHALLENGE</Text>
        <Text style={styles.buttonSubtext}>LET'S GET THIS BREAD!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurityLevel = () => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelTitle}>🛡️ LEVEL 1: SECURITY MASTER 🛡️</Text>
      
      <View style={styles.gameStatsContainer}>
        <Text style={styles.gameStats}>🏆 Score: {score}</Text>
        <Text style={styles.gameStats}>❤️ Lives: {lives}</Text>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>
          💀 If someone asks for your seed phrase, what do you do?
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.answerButton} 
        onPress={() => completeSecurityChallenge(false)}
      >
        <Text style={styles.answerText}>📱 Share it on Discord</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.answerButton} 
        onPress={() => completeSecurityChallenge(false)}
      >
        <Text style={styles.answerText}>💬 DM it to them</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.answerButton, styles.correctAnswer]} 
        onPress={() => completeSecurityChallenge(true)}
      >
        <Text style={styles.answerText}>🚫 NEVER SHARE IT!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMemoryLevel = () => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelTitle}>🧠 LEVEL 2: MEMORY PALACE 🧠</Text>
      
      <View style={styles.gameStatsContainer}>
        <Text style={styles.gameStats}>🏆 Score: {score}</Text>
        <Text style={styles.gameStats}>❤️ Lives: {lives}</Text>
      </View>

      <Text style={styles.challengeText}>
        Tap to reveal more words! Get 8 to unlock the next level 🎯
      </Text>

      <Text style={styles.progressText}>
        Progress: {revealedWords.length}/8 words revealed
      </Text>

      <View style={styles.memoryGrid}>
        {words.map((word, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.memoryCard,
              revealedWords.includes(index) ? styles.revealedCard : styles.hiddenCard
            ]}
            onPress={() => completeMemoryChallenge(index)}
            disabled={revealedWords.includes(index)}
          >
            <Text style={styles.cardNumber}>{index + 1}</Text>
            <Text style={styles.cardText}>
              {revealedWords.includes(index) ? word : '???'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSequenceLevel = () => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelTitle}>🎯 LEVEL 3: SEQUENCE MASTER 🎯</Text>
      
      <View style={styles.gameStatsContainer}>
        <Text style={styles.gameStats}>🏆 Score: {score}</Text>
        <Text style={styles.gameStats}>❤️ Lives: {lives}</Text>
      </View>

      <Text style={styles.challengeText}>
        Put the words in the correct order! 🔢
      </Text>

      <Text style={styles.progressText}>
        Progress: {selectedSequence.length}/12 words placed
      </Text>

      <View style={styles.sequenceContainer}>
        <Text style={styles.sequenceTitle}>NEXT WORD NEEDED:</Text>
        <Text style={styles.targetWord}>
          {selectedSequence.length < 12 ? `#${selectedSequence.length + 1}: ${words[selectedSequence.length]}` : 'COMPLETED!'}
        </Text>
      </View>

      <View style={styles.shuffledGrid}>
        {shuffledWords.map((word, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.shuffledCard,
              selectedSequence.includes(index) ? styles.usedCard : styles.availableCard
            ]}
            onPress={() => handleSequenceSelection(index)}
            disabled={selectedSequence.includes(index)}
          >
            <Text style={styles.shuffledCardText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFinalLevel = () => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelTitle}>👑 FINAL BOSS: GUARDIAN OATH 👑</Text>
      
      <View style={styles.gameStatsContainer}>
        <Text style={styles.gameStats}>🏆 Score: {score}</Text>
        <Text style={styles.gameStats}>❤️ Lives: {lives}</Text>
      </View>

      <View style={styles.oathBox}>
        <Text style={styles.oathTitle}>🛡️ THE GUARDIAN'S OATH 🛡️</Text>
        <Text style={styles.oathText}>I solemnly swear to:</Text>
        <Text style={styles.oathText}>• Never share my seed phrase</Text>
        <Text style={styles.oathText}>• Keep it written down safely</Text>
        <Text style={styles.oathText}>• Protect it with my life</Text>
        <Text style={styles.oathText}>• Be the ultimate hodler 💎🙌</Text>
      </View>

      <TouchableOpacity style={styles.oathButton} onPress={completeFinalChallenge}>
        <Text style={styles.oathButtonText}>⚔️ I ACCEPT THE OATH ⚔️</Text>
        <Text style={styles.buttonSubtext}>BECOME A SEED PHRASE GUARDIAN</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompletedLevel = () => (
    <View style={styles.levelContainer}>
      <Animated.Text style={[styles.victoryTitle, { transform: [{ scale: scaleAnim }] }]}>
        🏆 LEGENDARY GUARDIAN STATUS! 🏆
      </Animated.Text>
      
      <Text style={styles.finalScore}>FINAL SCORE: {score + 500}</Text>
      
      <View style={styles.achievementBox}>
        <Text style={styles.achievementTitle}>🎖️ ACHIEVEMENTS UNLOCKED 🎖️</Text>
        <Text style={styles.achievementText}>✅ Security Expert</Text>
        <Text style={styles.achievementText}>✅ Memory Master</Text>
        <Text style={styles.achievementText}>✅ Sequence Sensei</Text>
        <Text style={styles.achievementText}>✅ Guardian Elite</Text>
      </View>

      {showFinalPhrase && (
        <View style={styles.finalSeedSection}>
          <Text style={styles.finalSeedTitle}>🔐 YOUR LEGENDARY SEED PHRASE 🔐</Text>
          <View style={styles.finalSeedGrid}>
            {words.map((word, index) => (
              <View key={index} style={styles.finalWordContainer}>
                <Text style={styles.finalWordNumber}>{index + 1}</Text>
                <Text style={styles.finalWordText}>{word}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.finalCopyButton} onPress={copySeedPhrase}>
            <Text style={styles.finalCopyButtonText}>📋 COPY TO SECURE VAULT</Text>
            <Text style={styles.buttonSubtext}>GUARD IT WITH YOUR LIFE!</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.congratsText}>
        🦈 TRALALERO TRALALA IS PROUD OF YOU! 🦈
      </Text>
      <Text style={styles.congratsText}>
        🐊 BOMBARDIRO CROCODILO SALUTES YOUR DEDICATION! 🐊
      </Text>
    </View>
  );

  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 'intro': return renderIntroLevel();
      case 'security': return renderSecurityLevel();
      case 'memory': return renderMemoryLevel();
      case 'sequence': return renderSequenceLevel();
      case 'final': return renderFinalLevel();
      case 'completed': return renderCompletedLevel();
      default: return renderIntroLevel();
    }
  };

  return (
    <LinearGradient colors={['#FF6B9D', '#C44569', '#F8B500']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← BACK TO STASH</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {renderCurrentLevel()}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 25,
    paddingTop: 70,
  },
  backButton: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginBottom: 25,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  },
  levelContainer: {
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  levelTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  levelSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
  },
  gameStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  gameStats: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  challengeBox: {
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#FFF',
    padding: 25,
    marginBottom: 30,
    width: '100%',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginVertical: 5,
    textAlign: 'center',
  },
  startGameButton: {
    backgroundColor: '#00FF00',
    borderWidth: 5,
    borderColor: '#000',
    paddingVertical: 25,
    paddingHorizontal: 40,
    alignItems: 'center',
    transform: [{ rotate: '2deg' }],
    marginTop: 25,
  },
  startGameButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  buttonSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  questionBox: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 25,
    marginBottom: 25,
    width: '100%',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  answerButton: {
    backgroundColor: '#FFE4E1',
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  correctAnswer: {
    backgroundColor: '#90EE90',
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 25,
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  memoryCard: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 8,
  },
  revealedCard: {
    backgroundColor: '#90EE90',
  },
  hiddenCard: {
    backgroundColor: '#FFB6C1',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  sequenceContainer: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 20,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
  },
  sequenceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  targetWord: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF1493',
    marginTop: 8,
  },
  shuffledGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  shuffledCard: {
    width: '31%',
    paddingVertical: 20,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 8,
  },
  availableCard: {
    backgroundColor: '#87CEEB',
  },
  usedCard: {
    backgroundColor: '#D3D3D3',
    opacity: 0.5,
  },
  shuffledCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  oathBox: {
    backgroundColor: '#800080',
    borderWidth: 5,
    borderColor: '#FFD700',
    padding: 30,
    marginBottom: 30,
    width: '100%',
    borderRadius: 10,
  },
  oathTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  oathText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginVertical: 5,
    textAlign: 'center',
  },
  oathButton: {
    backgroundColor: '#FFD700',
    borderWidth: 5,
    borderColor: '#000',
    paddingVertical: 25,
    paddingHorizontal: 30,
    alignItems: 'center',
    transform: [{ rotate: '-1deg' }],
    borderRadius: 8,
  },
  oathButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  victoryTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    backgroundColor: '#000',
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginBottom: 25,
    borderRadius: 8,
  },
  achievementBox: {
    backgroundColor: '#4B0082',
    borderWidth: 4,
    borderColor: '#FFD700',
    padding: 25,
    marginBottom: 30,
    width: '100%',
    borderRadius: 10,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  achievementText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginVertical: 4,
    textAlign: 'center',
  },
  finalSeedSection: {
    width: '100%',
    marginBottom: 25,
  },
  finalSeedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 25,
  },
  finalSeedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  finalWordContainer: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#FFD700',
    padding: 15,
    margin: 4,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
  },
  finalWordNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
    marginRight: 10,
    width: 25,
  },
  finalWordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  finalCopyButton: {
    backgroundColor: '#32CD32',
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 22,
    alignItems: 'center',
    transform: [{ rotate: '1deg' }],
    borderRadius: 8,
  },
  finalCopyButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  congratsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
}); 