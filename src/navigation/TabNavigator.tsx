import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import HomeScreen from '../screens/HomeScreen';
import EducationScreen from '../screens/EducationScreen';
import { RootStackParamList, WalletData } from '../../App';
import { COLORS, SPACING, RADIUS } from '../theme';

export type TabParamList = {
  HomeTab: undefined;
  SendTab: undefined;
  LearnTab: undefined;
};

type TabNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  StackNavigationProp<TabParamList>
>;

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ focused, icon, iconType = 'text' }: { focused: boolean; icon: string | any; iconType?: 'text' | 'image' }) => (
  <View style={styles.tabIcon}>
    {iconType === 'image' ? (
      <Image 
        source={icon} 
        style={styles.tabIconImage} 
        resizeMode="contain"
      />
    ) : (
      <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>
        {icon}
      </Text>
    )}
  </View>
);

const TabLabel = ({ focused, label }: { focused: boolean; label: string }) => (
  <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
    {label}
  </Text>
);

const WALLETS_STORAGE_KEY = '@skibidi_wallets';

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const rootNavigation = useNavigation<TabNavigationProp>();
  
  const navigateToSend = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const walletsJson = await AsyncStorage.getItem('@skibidi_wallets');
      
      if (!walletsJson) {
        Alert.alert('No Wallet', 'Please create a wallet first');
        return;
      }
      
      const wallets: WalletData[] = JSON.parse(walletsJson);
      
      if (wallets.length === 0) {
        Alert.alert('No Wallet', 'Please create a wallet first');
        return;
      }
      
      // Use the first wallet (same logic as HomeScreen when no specific wallet is selected)
      rootNavigation.navigate('Send', { walletId: wallets[0].id, walletMnemonic: wallets[0].mnemonic });
      
    } catch (error) {
      console.error('Error navigating to send:', error);
      Alert.alert('Error', 'Failed to open send screen');
    }
  };

  return (
    <View style={styles.customTabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Handle the middle send button differently
        if (index === 1) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.sendButtonContainer}
              onPress={navigateToSend}
              activeOpacity={0.8}
            >
              <View style={styles.sendButton}>
                <Image 
                  source={require('../../assets/icons/send.png')}
                  style={styles.sendButtonImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          );
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.regularTabButton}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {options.tabBarIcon({ focused: isFocused })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Wrapper components that are compatible with tab navigator
const HomeTabScreen = (props: any) => <HomeScreen {...props} />;
const LearnTabScreen = (props: any) => <EducationScreen {...props} />;

// Dummy component for middle tab (won't be rendered)
const DummySendScreen = () => <View />;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTabScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <TabIcon 
                focused={focused} 
                icon={require('../../assets/icons/home.png')} 
                iconType="image" 
              />
              <TabLabel focused={focused} label="Home" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SendTab"
        component={DummySendScreen}
        options={{
          tabBarIcon: () => null, // This won't be used due to custom tab bar
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearnTabScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <TabIcon 
                focused={focused} 
                icon={require('../../assets/icons/learn.png')} 
                iconType="image" 
              />
              <TabLabel focused={focused} label="Learn" />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  
  // Custom Tab Bar Styles
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  
  regularTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sendButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sendButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2A2A2A', // Dark gray background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25, // This pushes it up outside the tab bar
    elevation: 12,
    shadowColor: '#FF6B35', // Orange glow effect
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.SURFACE,
  },
  
  sendButtonImage: {
    width: 85, // Large image that overflows the 72px circle
    height: 85,
  },
  
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  
  tabIconFocused: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  
  tabIconText: {
    fontSize: 18,
  },
  
  tabIconTextFocused: {
    fontSize: 18,
  },

  tabIconImage: {
    width: 28,
    height: 28,
  },
  
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
  
  tabLabelFocused: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
}); 