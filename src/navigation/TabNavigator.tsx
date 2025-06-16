import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Image } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import EducationScreen from '../screens/EducationScreen';
import { COLORS, SPACING, RADIUS } from '../theme';

export type TabParamList = {
  HomeTab: undefined;
  LearnTab: undefined;
};

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

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
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
        name="LearnTab"
        component={EducationScreen}
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