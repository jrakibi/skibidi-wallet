import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

type Props = {
  navigation: OnboardingScreenNavigationProp;
};

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: Props) {
  const [animValue] = useState(new Animated.Value(0));
  const [textIndex, setTextIndex] = useState(0);
  
  const chaosTexts = [
    "WELCOME TO THE SKIBIDIVERSE 🚽💀",
    "NO CAP THIS WALLET IS BUSSIN FR FR 🔥",
    "TRALALERO TRALALA 🦈 GOING HARD",
    "BOMBARDIRO CROCODILO 🐊 APPROVES",
    "IT'S GIVING MAIN CHARACTER ENERGY ✨",
    "READY TO SIGMA GRINDSET YOUR BITCOIN? 💰"
  ];

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTextIndex((prev) => (prev + 1) % chaosTexts.length);
        animate();
      });
    };
    animate();
  }, []);

  const createNewWallet = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const res = await fetch('http://192.168.1.5:8080/create-wallet', {
        method: 'POST',
      });
      const json = await res.json();
      
      if (json.success) {
        navigation.navigate('Wallet', {
          walletId: json.data.wallet_id,
          address: json.data.address,
          mnemonic: json.data.mnemonic,
        });
      } else {
        Alert.alert('Bruh Moment 💀', 'Wallet creation failed no cap');
      }
    } catch (error) {
      Alert.alert('Skill Issue Detected 🤡', 'Cannot connect to backend frfr');
    }
  };

  const restoreWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Restore');
  };

  return (
    <LinearGradient
      colors={['#FF00FF', '#00FFFF', '#FFFF00']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.chaosText,
            {
              opacity: animValue,
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
                {
                  rotate: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '5deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {chaosTexts[textIndex]}
        </Animated.Text>

        <Text style={styles.title}>
          🧠💀 SKIBIDI WALLET 💀🧠
        </Text>
        
        <Text style={styles.subtitle}>
          THE MOST OHIO BITCOIN WALLET
        </Text>
        
        <Text style={styles.subtitle}>
          ☕️ CAPPUCCINA BALLERINA APPROVED ☕️
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={createNewWallet}
          >
            <Text style={styles.buttonText}>
              CREATE NEW WALLET
            </Text>
            <Text style={styles.buttonSubtext}>
              (IT'S GIVING GENESIS BLOCK VIBES)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.restoreButton]}
            onPress={restoreWallet}
          >
            <Text style={styles.buttonText}>
              RESTORE WALLET
            </Text>
            <Text style={styles.buttonSubtext}>
              (BEEN THERE DONE THAT ERA)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          ⚠️ SELF-CUSTODIAL MEANS YOU'RE THE MAIN CHARACTER ⚠️
        </Text>
        <Text style={styles.disclaimer}>
          DON'T LOSE YOUR SEED PHRASE OR IT'S OVER 💀
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  chaosText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    position: 'absolute',
    top: 100,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginTop: 80,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    marginTop: 60,
    width: '100%',
  },
  button: {
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginVertical: 15,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
  },
  createButton: {
    backgroundColor: '#00FF00',
  },
  restoreButton: {
    backgroundColor: '#FF3333',
    transform: [{ rotate: '2deg' }],
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  buttonSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginTop: 5,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
}); 