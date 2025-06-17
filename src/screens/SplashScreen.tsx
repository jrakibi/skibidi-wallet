import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { 
  COLORS, 
  SPACING, 
  RADIUS, 
  SHADOWS, 
  TYPOGRAPHY,
  ANIMATIONS
} from '../theme';

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Splash'
>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');

// Splash screen floating images array
const floatingImages = [
  require('../../assets/splashScreen/splash7.png'),
  require('../../assets/splashScreen/splash8.png'),
  require('../../assets/splashScreen/brainrot1.png'),
  require('../../assets/splashScreen/brainrot2.png'),
  require('../../assets/splashScreen/brainrot3.png'),
  require('../../assets/splashScreen/brainrot4.png'),
  require('../../assets/splashScreen/brainrot5.png'),
  require('../../assets/splashScreen/brainrot6.png'),
];

// Create smooth floating animation with predetermined waypoints
const createSmoothFloatingAnimation = (animValue: Animated.Value, waypoints: number[], duration: number) => {
  const animations = waypoints.map((waypoint, index) => 
    Animated.timing(animValue, {
      toValue: waypoint,
      duration: duration / waypoints.length,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    })
  );
  
  return Animated.loop(
    Animated.sequence(animations)
  );
};

export default function SplashScreen({ navigation }: Props) {
  const [showContent, setShowContent] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showFloatingImages, setShowFloatingImages] = useState(false);
  
  // Main animation values
  const imageScale = useRef(new Animated.Value(4.0)).current; // Start at 400% zoom
  const imageTranslateX = useRef(new Animated.Value(0)).current; // Start centered horizontally
  const imageTranslateY = useRef(new Animated.Value(height * 1.3)).current; // Start from very bottom (mostly off-screen)
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonsSlideAnim = useRef(new Animated.Value(50)).current;

  // Floating images animations - positioned around screen edges
  const floatingAnimations = useRef(
    floatingImages.map((_, index) => {
      // Calculate positions around the screen perimeter
      const totalImages = floatingImages.length;
      const angleStep = (2 * Math.PI) / totalImages;
      const angle = index * angleStep;
      
      // Position on screen edges with some margin
      const margin = 60;
      const centerX = width / 2;
      const centerY = height / 2;
      const radiusX = (width / 2) - margin;
      const radiusY = (height / 2) - margin;
      
      const baseX = centerX + Math.cos(angle) * radiusX - centerX;
      const baseY = centerY + Math.sin(angle) * radiusY - centerY;
      
      return {
        baseX, // Store base position for reference
        baseY,
        translateX: new Animated.Value(baseX),
        translateY: new Animated.Value(baseY),
        rotation: new Animated.Value(Math.random() * 360),
                 scale: new Animated.Value(
           index === 1 ? 1.2 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3
         ), // splash8.png (index 1) is much bigger: 1.2-1.5x, others: 0.4-0.7x
        opacity: new Animated.Value(0),
      };
    })
  ).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startFloatingAnimations = () => {
    setShowFloatingImages(true);
    
    // Fade in all floating images
    const fadeInAnimations = floatingAnimations.map((anim) =>
      Animated.timing(anim.opacity, {
        toValue: 0.3,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    Animated.stagger(200, fadeInAnimations).start();

    // Start gentle floating animations around each image's base position
    floatingAnimations.forEach((anim) => {
      const floatRange = 20; // Small floating range around base position
      
      // Generate gentle waypoints around base position for X movement
      const xWaypoints = Array.from({ length: 4 }, () => 
        anim.baseX + (Math.random() - 0.5) * floatRange
      );
      
      // Generate gentle waypoints around base position for Y movement  
      const yWaypoints = Array.from({ length: 4 }, () => 
        anim.baseY + (Math.random() - 0.5) * floatRange
      );
      
      // Start gentle floating animations in small area
      createSmoothFloatingAnimation(anim.translateX, xWaypoints, 8000).start(); // Gentle horizontal floating
      createSmoothFloatingAnimation(anim.translateY, yWaypoints, 10000).start(); // Gentle vertical floating
      
      // Gentle continuous rotation
      Animated.loop(
        Animated.timing(anim.rotation, {
          toValue: 360,
          duration: 15000, // Slower 15 second rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  };

  const startAnimation = () => {
    // First, fade in the image
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
             // Then animate the image moving and scaling
       Animated.parallel([
         Animated.timing(imageScale, {
           toValue: 1, // Scale down to normal size
           duration: 3500, // Much slower animation
           easing: Easing.out(Easing.cubic),
           useNativeDriver: true,
         }),
         Animated.timing(imageTranslateY, {
           toValue: 0, // Move up to final position
           duration: 3500, // Much slower animation
           easing: Easing.out(Easing.cubic),
           useNativeDriver: true,
         }),
       ]).start(() => {
        // Animation complete, show content
        setShowContent(true);
        setAnimationComplete(true);
        
        // Animate content appearance
        Animated.sequence([
          Animated.parallel([
            Animated.timing(contentFadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(titleSlideAnim, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(buttonsSlideAnim, {
            toValue: 0,
            duration: 600,
            delay: 200,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Start floating brainrot animations after everything is in place
          setTimeout(() => {
            startFloatingAnimations();
          }, 1000);
        });
      });
    });
  };

  const handleCreateWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateWallet');
  };

  const handleRestoreWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Restore');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Floating Brainrot Images */}
      {showFloatingImages && (
        <View style={styles.floatingContainer}>
          {floatingImages.map((image, index) => (
            <Animated.View
              key={index}
              style={[
                styles.floatingImage,
                {
                  opacity: floatingAnimations[index].opacity,
                  transform: [
                    { translateX: floatingAnimations[index].translateX },
                    { translateY: floatingAnimations[index].translateY },
                    { scale: floatingAnimations[index].scale },
                    { 
                      rotate: floatingAnimations[index].rotation.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      })
                    },
                  ],
                },
              ]}
            >
              <Image
                source={image}
                style={styles.brainrotImage}
                resizeMode="contain"
              />
            </Animated.View>
          ))}
        </View>
      )}
      
      {/* Animated Main Image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: imageOpacity,
            transform: [
              { translateX: imageTranslateX },
              { translateY: imageTranslateY },
              { scale: imageScale },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/skibidi-send.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Content that appears after animation */}
      {showContent && (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentFadeAnim,
            },
          ]}
        >
          {/* App Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ translateY: titleSlideAnim }],
              },
            ]}
          >
            <Text style={styles.appTitle}>Skibidi Cash</Text>
            <Text style={styles.appSubtitle}>Your Bitcoin Adventure Begins</Text>
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ translateY: buttonsSlideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRestoreWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  imageContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  
  splashImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    zIndex: 2,
  },
  
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
    marginTop: SPACING.XXL,
  },
  
  appTitle: {
    fontSize: TYPOGRAPHY.HERO,
    fontWeight: TYPOGRAPHY.BLACK,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
    letterSpacing: -1,
  },
  
  appSubtitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  
  buttonContainer: {
    width: '100%',
    gap: SPACING.MD,
    maxWidth: 320,
  },
  
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.GLOW_GRAY,
  },
  
  primaryButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  secondaryButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind main content
  },
  
  floatingImage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  
  brainrotImage: {
    width: 160,
    height: 160,
  },
}); 