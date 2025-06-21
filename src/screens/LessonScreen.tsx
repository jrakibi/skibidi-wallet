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
  FlatList,
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type LessonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lesson'>;
type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;

type Props = {
  navigation: LessonScreenNavigationProp;
  route: LessonScreenRouteProp;
};

interface CurriculumModule {
  id: string;
  title: string;
  subtitle: string;
  lessons: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  unlocked: boolean;
  image: any;
  color: string;
  description: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export default function LessonScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [totalProgress, setTotalProgress] = useState(12);
  const [userLevel, setUserLevel] = useState('Bitcoin Noob');

  const curriculumModules: CurriculumModule[] = [
    {
      id: '1',
      title: 'Bitcoin Basics',
      subtitle: 'Start Your Journey',
      lessons: 8,
      duration: '2 hours',
      difficulty: 'Beginner',
      progress: 75,
      unlocked: true,
      image: require('../../assets/learn/bitcoin.png'),
      color: COLORS.BITCOIN_ORANGE,
      description: 'What is Bitcoin, how it works, and why it matters'
    },
    {
      id: '2',
      title: 'Wallet Security',
      subtitle: 'Protect Your Coins',
      lessons: 6,
      duration: '1.5 hours',
      difficulty: 'Beginner',
      progress: 30,
      unlocked: true,
      image: require('../../assets/brainrot/brainrot1.png'),
      color: COLORS.ACCENT,
      description: 'Private keys, seed phrases, and wallet best practices'
    },
    {
      id: '3',
      title: 'Blockchain Deep Dive',
      subtitle: 'Under the Hood',
      lessons: 10,
      duration: '3 hours',
      difficulty: 'Intermediate',
      progress: 0,
      unlocked: false,
      image: require('../../assets/brainrot/brainrot2.png'),
      color: COLORS.SECONDARY,
      description: 'How blocks, hashes, and mining work'
    },
    {
      id: '4',
      title: 'Trading & Investing',
      subtitle: 'Stack Sats',
      lessons: 12,
      duration: '4 hours',
      difficulty: 'Intermediate',
      progress: 0,
      unlocked: false,
      image: require('../../assets/brainrot/brainrot3.png'),
      color: COLORS.WARNING,
      description: 'DCA, HODLing, and investment strategies'
    },
    {
      id: '5',
      title: 'Lightning Network',
      subtitle: 'Instant Payments',
      lessons: 8,
      duration: '2.5 hours',
      difficulty: 'Advanced',
      progress: 0,
      unlocked: false,
      image: require('../../assets/brainrot/brainrot4.png'),
      color: COLORS.INFO,
      description: 'Layer 2 scaling and instant transactions'
    },
    {
      id: '6',
      title: 'Bitcoin Culture',
      subtitle: 'Number Go Up',
      lessons: 5,
      duration: '1 hour',
      difficulty: 'Beginner',
      progress: 0,
      unlocked: false,
      image: require('../../assets/brainrot/brainrot5.png'),
      color: COLORS.SUCCESS,
      description: 'Memes, community, and Bitcoin lifestyle'
    }
  ];

  const achievements: Achievement[] = [
    { id: '1', title: 'First Steps', description: 'Complete your first lesson', icon: '01', unlocked: true },
    { id: '2', title: 'Wallet Master', description: 'Secure your first wallet', icon: '02', unlocked: true },
    { id: '3', title: 'Blockchain Explorer', description: 'Understand how blocks work', icon: '03', unlocked: false },
    { id: '4', title: 'Satoshi Student', description: 'Complete 10 lessons', icon: '04', unlocked: false },
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

  const handleModulePress = (module: CurriculumModule) => {
    if (!module.unlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to the course content screen
    navigation.navigate('CourseContent', { 
      courseId: module.id, 
      courseTitle: module.title 
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return COLORS.SUCCESS;
      case 'Intermediate': return COLORS.WARNING;
      case 'Advanced': return COLORS.ERROR;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  const renderModuleCard = ({ item, index }: { item: CurriculumModule; index: number }) => (
    <Animated.View
      style={[
        styles.moduleCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.moduleCardInner,
          { borderColor: item.color + '40' },
          !item.unlocked && styles.moduleCardLocked
        ]}
        onPress={() => handleModulePress(item)}
        activeOpacity={item.unlocked ? 0.8 : 1}
      >
        {/* Module Header */}
        <View style={styles.moduleHeader}>
          <Image source={item.image} style={styles.moduleImage} />
          <View style={styles.moduleInfo}>
            <Text style={[styles.moduleTitle, !item.unlocked && styles.lockedText]}>
              {item.title}
            </Text>
            <Text style={[styles.moduleSubtitle, !item.unlocked && styles.lockedText]}>
              {item.subtitle}
            </Text>
            <Text style={[styles.moduleDescription, !item.unlocked && styles.lockedText]}>
              {item.description}
            </Text>
          </View>
        </View>

        {/* Module Stats */}
        <View style={styles.moduleStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.lessons}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        {item.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${item.progress}%`, backgroundColor: item.color }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{item.progress}% Complete</Text>
          </View>
        )}

                 {/* Lock Overlay */}
         {!item.unlocked && (
           <View style={styles.lockOverlay}>
             <View style={styles.lockIconContainer}>
               <Text style={styles.lockIconText}>LOCKED</Text>
             </View>
             <Text style={styles.lockText}>Complete previous modules to unlock</Text>
           </View>
         )}
      </TouchableOpacity>
    </Animated.View>
  );

     const renderAchievement = ({ item }: { item: Achievement }) => (
     <View style={[styles.achievementCard, !item.unlocked && styles.achievementLocked]}>
       <View style={[styles.achievementIconContainer, !item.unlocked && styles.achievementIconLocked]}>
         <Text style={styles.achievementIcon}>{item.icon}</Text>
       </View>
       <View style={styles.achievementInfo}>
         <Text style={[styles.achievementTitle, !item.unlocked && styles.lockedText]}>
           {item.title}
         </Text>
         <Text style={[styles.achievementDescription, !item.unlocked && styles.lockedText]}>
           {item.description}
         </Text>
       </View>
     </View>
   );

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
        <Text style={styles.headerTitle}>Bitcoin Academy</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{userLevel}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview */}
        <Animated.View style={[styles.progressOverview, { opacity: fadeAnim }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressPercentage}>{totalProgress}%</Text>
          </View>
          <View style={styles.overallProgressBar}>
            <View style={[styles.overallProgressFill, { width: `${totalProgress}%` }]} />
          </View>
                     <Text style={styles.progressSubtext}>
             Keep going! You're doing great
           </Text>
        </Animated.View>

        {/* Curriculum Modules */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Learning Path</Text>
          <FlatList
            data={curriculumModules}
            renderItem={renderModuleCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.modulesList}
          />
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <FlatList
            data={achievements}
            renderItem={renderAchievement}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsList}
          />
        </View>

        {/* Motivational Quote */}
        <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
          <Text style={styles.quoteText}>
            "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"
          </Text>
          <Text style={styles.quoteAuthor}>- Genesis Block Message</Text>
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  levelBadge: {
    backgroundColor: COLORS.BITCOIN_ORANGE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  progressOverview: {
    margin: SPACING.LG,
    padding: SPACING.LG,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: RADIUS.LG,
    ...SHADOWS.SUBTLE,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.BITCOIN_ORANGE,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 4,
    marginBottom: SPACING.SM,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: COLORS.BITCOIN_ORANGE,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  curriculumSection: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    letterSpacing: -0.5,
  },
  modulesList: {
    gap: SPACING.LG,
  },
  moduleCard: {
    marginBottom: SPACING.SM,
  },
  moduleCardInner: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SUBTLE,
  },
  moduleCardLocked: {
    opacity: 0.6,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  moduleImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.MD,
    marginRight: SPACING.MD,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  moduleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    gap: SPACING.LG,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginTop: SPACING.SM,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: 3,
    marginBottom: SPACING.XS,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND + 'CC',
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.XS,
  },
     lockIconContainer: {
     backgroundColor: COLORS.SURFACE_ELEVATED,
     borderRadius: RADIUS.SM,
     paddingHorizontal: SPACING.SM,
     paddingVertical: SPACING.XS,
     marginBottom: SPACING.SM,
   },
   lockIconText: {
     fontSize: 10,
     fontWeight: '700',
     color: COLORS.TEXT_TERTIARY,
     letterSpacing: 1,
   },
  lockText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
  },
  lockedText: {
    color: COLORS.TEXT_TERTIARY,
  },
  achievementsSection: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  achievementsList: {
    gap: SPACING.MD,
    paddingRight: SPACING.LG,
  },
  achievementCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
    width: 120,
    ...SHADOWS.SUBTLE,
  },
  achievementLocked: {
    opacity: 0.5,
  },
     achievementIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: COLORS.BITCOIN_ORANGE,
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: SPACING.SM,
   },
   achievementIconLocked: {
     backgroundColor: COLORS.SURFACE_ELEVATED,
   },
   achievementIcon: {
     fontSize: 14,
     fontWeight: '700',
     color: COLORS.TEXT_PRIMARY,
   },
  achievementInfo: {
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 14,
  },
  quoteCard: {
    margin: SPACING.LG,
    padding: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.BITCOIN_ORANGE,
    ...SHADOWS.SUBTLE,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.XS,
  },
  quoteAuthor: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
  },
}); 