import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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

type EducationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Education'>;

type Props = {
  navigation: EducationScreenNavigationProp;
};

interface Lesson {
  id: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  locked: boolean;
  points: number;
}

export default function EducationScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Sample lessons structure - you can replace this with your actual lessons
  const [lessons] = useState<Lesson[]>([
    {
      id: '1',
      title: 'What is Bitcoin?',
      description: 'Learn the basics of Bitcoin',
      emoji: '₿',
      difficulty: 'beginner',
      completed: false,
      locked: false,
      points: 10
    },
    {
      id: '2',
      title: 'Bitcoin Wallets',
      description: 'Understanding wallet types',
      emoji: '👛',
      difficulty: 'beginner',
      completed: false,
      locked: true,
      points: 15
    },
    {
      id: '3',
      title: 'Private Keys',
      description: 'Security fundamentals',
      emoji: '🔐',
      difficulty: 'intermediate',
      completed: false,
      locked: true,
      points: 20
    },
    {
      id: '4',
      title: 'Lightning Network',
      description: 'Fast Bitcoin payments',
      emoji: '⚡',
      difficulty: 'intermediate',
      completed: false,
      locked: true,
      points: 25
    },
    {
      id: '5',
      title: 'Mining & Consensus',
      description: 'How Bitcoin works',
      emoji: '⛏️',
      difficulty: 'advanced',
      completed: false,
      locked: true,
      points: 30
    }
  ]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.MEDIUM,
      useNativeDriver: true,
    }).start();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return COLORS.SUCCESS;
      case 'intermediate': return COLORS.WARNING;
      case 'advanced': return COLORS.ERROR;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  const openLesson = (lesson: Lesson) => {
    if (lesson.locked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Lesson', { lessonId: lesson.id });
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
        <Text style={styles.headerTitle}>Learn Bitcoin</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{totalPoints} pts</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
            <Text style={styles.progressSubtext}>
              {lessons.filter(l => l.completed).length} of {lessons.length} lessons completed
            </Text>
          </View>

          {/* Lessons List */}
          <View style={styles.lessonsContainer}>
            <Text style={styles.sectionTitle}>Lessons</Text>
            
            {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  lesson.locked && styles.lessonCardLocked,
                  lesson.completed && styles.lessonCardCompleted
                ]}
                onPress={() => openLesson(lesson)}
                activeOpacity={lesson.locked ? 1 : 0.7}
              >
                <View style={styles.lessonLeft}>
                  <View style={[
                    styles.lessonIcon,
                    lesson.locked && styles.lessonIconLocked,
                    lesson.completed && styles.lessonIconCompleted
                  ]}>
                    <Text style={styles.lessonEmoji}>
                      {lesson.locked ? '🔒' : lesson.completed ? '✅' : lesson.emoji}
                    </Text>
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={[
                      styles.lessonTitle,
                      lesson.locked && styles.lessonTitleLocked
                    ]}>
                      {lesson.title}
                    </Text>
                    <Text style={[
                      styles.lessonDescription,
                      lesson.locked && styles.lessonDescriptionLocked
                    ]}>
                      {lesson.description}
                    </Text>
                    <View style={styles.lessonMeta}>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }
                      ]}>
                        <Text style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(lesson.difficulty) }
                        ]}>
                          {lesson.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.pointsLabel}>+{lesson.points} pts</Text>
                    </View>
                  </View>
                </View>
                
                {!lesson.locked && (
                  <Text style={styles.lessonArrow}>→</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

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
  
  progressCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
    ...SHADOWS.SUBTLE,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  pointsBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 4,
    marginBottom: SPACING.SM,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  
  progressSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  
  lessonsContainer: {
    gap: SPACING.SM,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  lessonCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    marginBottom: SPACING.SM,
  },
  
  lessonCardLocked: {
    opacity: 0.6,
  },
  
  lessonCardCompleted: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.SUCCESS + '10',
  },
  
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  lessonIconLocked: {
    backgroundColor: COLORS.TEXT_TERTIARY + '20',
  },
  
  lessonIconCompleted: {
    backgroundColor: COLORS.SUCCESS + '20',
  },
  
  lessonEmoji: {
    fontSize: 20,
  },
  
  lessonInfo: {
    flex: 1,
    gap: SPACING.XS,
  },
  
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  
  lessonTitleLocked: {
    color: COLORS.TEXT_SECONDARY,
  },
  
  lessonDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  
  lessonDescriptionLocked: {
    color: COLORS.TEXT_TERTIARY,
  },
  
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  
  difficultyBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: RADIUS.XS,
  },
  
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  pointsLabel: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    fontWeight: '500',
  },
  
  lessonArrow: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
}); 