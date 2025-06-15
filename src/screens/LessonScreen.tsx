import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  TEXT_STYLES, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  ANIMATIONS 
} from '../theme';

type LessonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lesson'>;
type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;

type Props = {
  navigation: LessonScreenNavigationProp;
  route: LessonScreenRouteProp;
};

interface LessonContent {
  id: string;
  title: string;
  content: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  points: number;
}

export default function LessonScreen({ navigation, route }: Props) {
  const { lessonId } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Sample lesson content - you can replace this with your actual lesson data
  const [lessonContent] = useState<LessonContent>({
    id: lessonId,
    title: 'What is Bitcoin?',
    content: `Bitcoin is a decentralized digital currency that operates without a central authority like a bank or government.

Key features of Bitcoin:

• **Decentralized**: No single entity controls it
• **Digital**: Exists only in electronic form  
• **Peer-to-peer**: Direct transactions between users
• **Limited supply**: Only 21 million will ever exist
• **Transparent**: All transactions are public on the blockchain

Bitcoin was created in 2009 by an anonymous person or group using the pseudonym "Satoshi Nakamoto". It was the first successful cryptocurrency and remains the most valuable and widely adopted.

The Bitcoin network is secured by thousands of computers around the world that validate transactions and maintain the blockchain ledger.`,
    quiz: {
      question: 'What is the maximum number of Bitcoin that will ever exist?',
      options: ['100 million', '21 million', '50 million', 'Unlimited'],
      correctAnswer: 1
    },
    points: 10
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === lessonContent.quiz?.correctAnswer;
    
    if (isCorrect) {
      setCompleted(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Alert.alert(
          '🎉 Lesson Complete!',
          `You earned ${lessonContent.points} points!`,
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
      }, 1000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const retryQuiz = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text style={styles.headerTitle}>Lesson</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* Lesson Header */}
          <View style={styles.lessonHeader}>
            <Text style={styles.lessonTitle}>{lessonContent.title}</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{lessonContent.points} pts</Text>
            </View>
          </View>

          {/* Lesson Content */}
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{lessonContent.content}</Text>
          </View>

          {/* Quiz Section */}
          {lessonContent.quiz && (
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>Quick Quiz</Text>
              <Text style={styles.quizQuestion}>{lessonContent.quiz.question}</Text>
              
              <View style={styles.optionsContainer}>
                {lessonContent.quiz.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === lessonContent.quiz?.correctAnswer;
                  const showCorrect = showResult && isCorrect;
                  const showIncorrect = showResult && isSelected && !isCorrect;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                        showCorrect && styles.optionButtonCorrect,
                        showIncorrect && styles.optionButtonIncorrect,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showResult}
                    >
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        showCorrect && styles.optionTextCorrect,
                        showIncorrect && styles.optionTextIncorrect,
                      ]}>
                        {option}
                      </Text>
                      {showCorrect && <Text style={styles.checkMark}>✓</Text>}
                      {showIncorrect && <Text style={styles.crossMark}>✗</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quiz Actions */}
              <View style={styles.quizActions}>
                {!showResult ? (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      selectedAnswer === null && styles.submitButtonDisabled
                    ]}
                    onPress={submitAnswer}
                    disabled={selectedAnswer === null}
                  >
                    <Text style={styles.submitButtonText}>Submit Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.resultContainer}>
                    {completed ? (
                      <View style={styles.successContainer}>
                        <Text style={styles.successText}>🎉 Correct!</Text>
                        <Text style={styles.successSubtext}>
                          You've completed this lesson
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.retryContainer}>
                        <Text style={styles.retryText}>Not quite right</Text>
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={retryQuiz}
                        >
                          <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

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
    paddingTop: 60,
    paddingBottom: SPACING.LG,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  placeholder: {
    width: 40,
  },
  
  content: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  
  pointsBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  contentCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
    ...SHADOWS.SUBTLE,
  },
  
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  
  quizCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  quizQuestion: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    fontWeight: '500',
  },
  
  optionsContainer: {
    gap: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  
  optionButton: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  optionButtonSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  
  optionButtonCorrect: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.SUCCESS + '10',
  },
  
  optionButtonIncorrect: {
    borderColor: COLORS.ERROR,
    backgroundColor: COLORS.ERROR + '10',
  },
  
  optionText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  
  optionTextSelected: {
    fontWeight: '500',
  },
  
  optionTextCorrect: {
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  
  optionTextIncorrect: {
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  
  checkMark: {
    fontSize: 16,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  
  crossMark: {
    fontSize: 16,
    color: COLORS.ERROR,
    fontWeight: 'bold',
  },
  
  quizActions: {
    alignItems: 'center',
  },
  
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    minWidth: 150,
    alignItems: 'center',
  },
  
  submitButtonDisabled: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    opacity: 0.5,
  },
  
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  
  successContainer: {
    alignItems: 'center',
    gap: SPACING.SM,
  },
  
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  
  successSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  
  retryContainer: {
    alignItems: 'center',
    gap: SPACING.MD,
  },
  
  retryText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  
  retryButton: {
    backgroundColor: COLORS.WARNING,
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
}); 