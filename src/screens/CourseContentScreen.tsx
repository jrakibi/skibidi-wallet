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
  Alert,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CourseContentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CourseContent'>;
type CourseContentScreenRouteProp = RouteProp<RootStackParamList, 'CourseContent'>;

type Props = {
  navigation: CourseContentScreenNavigationProp;
  route: CourseContentScreenRouteProp;
};

interface CourseSection {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  quiz?: Quiz;
  completed: boolean;
}

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: string;
  duration: string;
  totalPoints: number;
  sections: CourseSection[];
  color: string;
  image: any;
}

export default function CourseContentScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Mock course data - in real app, this would come from props or API
  const courseData: CourseData = {
    id: '1',
    title: 'Bitcoin Basics',
    subtitle: 'Start Your Journey',
    description: 'What is Bitcoin, how it works, and why it matters',
    difficulty: 'Beginner',
    duration: '2 hours',
    totalPoints: 500,
    color: COLORS.BITCOIN_ORANGE,
    image: require('../../assets/learn/bitcoin.png'),
    sections: [
      {
        id: '1',
        title: 'What is Bitcoin?',
        content: `Bitcoin is a revolutionary digital currency that operates without a central authority. It's the first successful implementation of a peer-to-peer electronic cash system.

Key Features:
• Decentralized - No single entity controls it
• Digital - Exists only in digital form
• Scarce - Only 21 million will ever exist
• Borderless - Works across the globe
• Permissionless - Anyone can use it

Bitcoin was created in 2008 by an anonymous person or group known as Satoshi Nakamoto. The Bitcoin network went live on January 3, 2009, with the mining of the first block, known as the genesis block.

Unlike traditional currencies controlled by governments and banks, Bitcoin is maintained by a network of computers (nodes) around the world. This makes it resistant to censorship and manipulation.`,
        quiz: {
          id: 'q1',
          question: 'How many bitcoins will ever exist?',
          options: ['100 million', '21 million', '50 million', 'Unlimited'],
          correctAnswer: 1,
          explanation: 'Bitcoin has a fixed supply cap of 21 million coins, making it a deflationary asset.',
          points: 50
        },
        completed: false
      },
      {
        id: '2',
        title: 'How Bitcoin Works',
        content: `Bitcoin operates on a technology called blockchain - a distributed ledger that records all transactions across a network of computers.

The Blockchain:
• A chain of blocks containing transaction data
• Each block is linked to the previous one
• Cryptographically secured and tamper-proof
• Maintained by thousands of nodes worldwide

Mining:
• The process of validating and adding new transactions
• Miners compete to solve complex mathematical puzzles
• Winners get rewarded with new bitcoins
• This process secures the network

Transactions:
• Digital signatures prove ownership
• Transactions are broadcast to the network
• Miners include them in new blocks
• Once confirmed, transactions are irreversible`,
        quiz: {
          id: 'q2',
          question: 'What is the primary purpose of Bitcoin mining?',
          options: ['To create new bitcoins', 'To validate transactions and secure the network', 'To store bitcoins', 'To trade bitcoins'],
          correctAnswer: 1,
          explanation: 'While miners do receive new bitcoins as rewards, the primary purpose of mining is to validate transactions and secure the Bitcoin network.',
          points: 75
        },
        completed: false
      },
      {
        id: '3',
        title: 'Why Bitcoin Matters',
        content: `Bitcoin represents more than just a new form of money - it's a paradigm shift towards financial sovereignty and freedom.

Financial Freedom:
• Be your own bank
• No need for intermediaries
• Access to global financial system
• Protection against inflation

Innovation Driver:
• Sparked the cryptocurrency revolution
• Introduced blockchain technology
• Inspired countless innovations
• Created new economic models

Store of Value:
• Often called "digital gold"
• Hedge against currency debasement
• Protection against inflation
• Portfolio diversification

Global Impact:
• Banking the unbanked
• Remittances without borders
• Economic empowerment
• Technological advancement`,
        quiz: {
          id: 'q3',
          question: 'Why is Bitcoin often called "digital gold"?',
          options: ['It\'s yellow in color', 'It\'s used to make jewelry', 'It serves as a store of value like gold', 'It\'s mined from the ground'],
          correctAnswer: 2,
          explanation: 'Bitcoin is called "digital gold" because it shares many properties with gold as a store of value: scarcity, durability, and resistance to inflation.',
          points: 100
        },
        completed: false
      }
    ]
  };

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

  const handleNextSection = () => {
    if (currentSection < courseData.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setSelectedAnswer(null);
    setShowResult(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentQuiz = courseData.sections[currentSection].quiz!;
    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
    
    setShowResult(true);
    
    if (isCorrect) {
      setUserPoints(prev => prev + currentQuiz.points);
      setCompletedSections(prev => new Set([...prev, courseData.sections[currentSection].id]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleCompleteCourse = () => {
    Alert.alert(
      'Course Completed! 🎉',
      `Congratulations! You've earned ${userPoints} points and completed the ${courseData.title} course.`,
      [
        {
          text: 'Continue Learning',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const renderQuizModal = () => {
    const currentQuiz = courseData.sections[currentSection].quiz;
    if (!currentQuiz) return null;

    return (
      <Modal
        visible={showQuiz}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseQuiz}
      >
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleCloseQuiz} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.quizTitle}>Quiz Time! 🧠</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{currentQuiz.points} pts</Text>
            </View>
          </View>

          <View style={styles.quizContent}>
            <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
            
            <View style={styles.optionsContainer}>
              {currentQuiz.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.selectedOption,
                    showResult && index === currentQuiz.correctAnswer && styles.correctOption,
                    showResult && selectedAnswer === index && index !== currentQuiz.correctAnswer && styles.incorrectOption
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === index && styles.selectedOptionText,
                    showResult && index === currentQuiz.correctAnswer && styles.correctOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {showResult && (
              <View style={styles.resultContainer}>
                <Text style={[
                  styles.resultText,
                  selectedAnswer === currentQuiz.correctAnswer ? styles.correctResult : styles.incorrectResult
                ]}>
                  {selectedAnswer === currentQuiz.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                </Text>
                <Text style={styles.explanationText}>{currentQuiz.explanation}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, showResult && styles.submitButtonDone]}
              onPress={showResult ? handleCloseQuiz : handleSubmitAnswer}
              disabled={selectedAnswer === null && !showResult}
            >
              <Text style={styles.submitButtonText}>
                {showResult ? 'Continue' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const currentSectionData = courseData.sections[currentSection];
  const progressPercentage = ((currentSection + 1) / courseData.sections.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{courseData.title}</Text>
          <Text style={styles.headerSubtitle}>{courseData.subtitle}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{userPoints}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentSection + 1} of {courseData.sections.length} • {Math.round(progressPercentage)}%
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Content */}
        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{currentSectionData.title}</Text>
          <Text style={styles.sectionContent}>{currentSectionData.content}</Text>
        </Animated.View>

        {/* Quiz Section */}
        {currentSectionData.quiz && (
          <Animated.View style={[styles.quizPreview, { opacity: fadeAnim }]}>
            <View style={styles.quizPreviewHeader}>
              <Text style={styles.quizPreviewTitle}>Ready for a Quiz?</Text>
              <Text style={styles.quizPreviewSubtitle}>
                Test your knowledge and earn {currentSectionData.quiz.points} points!
              </Text>
            </View>
            <TouchableOpacity style={styles.startQuizButton} onPress={handleStartQuiz}>
              <Text style={styles.startQuizButtonText}>Start Quiz</Text>
              <Ionicons name="play" size={20} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentSection === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousSection}
          disabled={currentSection === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentSection === 0 ? COLORS.TEXT_TERTIARY : COLORS.TEXT_PRIMARY} />
          <Text style={[styles.navButtonText, currentSection === 0 && styles.navButtonTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={currentSection === courseData.sections.length - 1 ? handleCompleteCourse : handleNextSection}
        >
          <Text style={styles.navButtonText}>
            {currentSection === courseData.sections.length - 1 ? 'Complete Course' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {renderQuizModal()}
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
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.MD,
  },
  backButton: {
    padding: SPACING.XS,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  headerTitle: {
    ...TEXT_STYLES.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    ...TEXT_STYLES.CAPTION,
    color: COLORS.TEXT_SECONDARY,
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.BITCOIN_ORANGE + '20',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  pointsValue: {
    ...TEXT_STYLES.H4,
    color: COLORS.BITCOIN_ORANGE,
    fontWeight: 'bold',
  },
  pointsLabel: {
    ...TEXT_STYLES.CAPTION,
    color: COLORS.BITCOIN_ORANGE,
  },
  progressContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.BITCOIN_ORANGE,
  },
  progressText: {
    ...TEXT_STYLES.CAPTION,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  sectionContainer: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    ...TEXT_STYLES.H2,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  sectionContent: {
    ...TEXT_STYLES.BODY,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 24,
  },
  quizPreview: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BITCOIN_ORANGE + '30',
  },
  quizPreviewHeader: {
    marginBottom: SPACING.MD,
  },
  quizPreviewTitle: {
    ...TEXT_STYLES.H4,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  quizPreviewSubtitle: {
    ...TEXT_STYLES.BODY,
    color: COLORS.TEXT_SECONDARY,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BITCOIN_ORANGE,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.SM,
  },
  startQuizButtonText: {
    ...TEXT_STYLES.BUTTON,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.XS,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.SM,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...TEXT_STYLES.BUTTON,
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: SPACING.XS,
  },
  navButtonTextDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
  quizContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  quizTitle: {
    ...TEXT_STYLES.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  pointsBadge: {
    backgroundColor: COLORS.SUCCESS + '20',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  pointsText: {
    ...TEXT_STYLES.CAPTION,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  quizContent: {
    flex: 1,
    padding: SPACING.MD,
  },
  quizQuestion: {
    ...TEXT_STYLES.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: SPACING.LG,
  },
  optionButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  selectedOption: {
    borderColor: COLORS.BITCOIN_ORANGE,
    backgroundColor: COLORS.BITCOIN_ORANGE + '10',
  },
  correctOption: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.SUCCESS + '10',
  },
  incorrectOption: {
    borderColor: COLORS.ERROR,
    backgroundColor: COLORS.ERROR + '10',
  },
  optionText: {
    ...TEXT_STYLES.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  correctOptionText: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  resultText: {
    ...TEXT_STYLES.H4,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  correctResult: {
    color: COLORS.SUCCESS,
  },
  incorrectResult: {
    color: COLORS.ERROR,
  },
  explanationText: {
    ...TEXT_STYLES.BODY,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: COLORS.BITCOIN_ORANGE,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  submitButtonDone: {
    backgroundColor: COLORS.SUCCESS,
  },
  submitButtonText: {
    ...TEXT_STYLES.BUTTON,
    color: COLORS.TEXT_PRIMARY,
  },
});