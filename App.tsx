import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/screens/OnboardingScreen';
import WalletScreen from './src/screens/WalletScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import BackupScreen from './src/screens/BackupScreen';
import RestoreScreen from './src/screens/RestoreScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import EducationScreen from './src/screens/EducationScreen';
import LessonScreen from './src/screens/LessonScreen';
import HomeScreen from './src/screens/HomeScreen';
import TabNavigator from './src/navigation/TabNavigator';

export type WalletData = {
  id: string;
  name: string;
  address: string;
  mnemonic: string;
  balance: number;
  createdAt: string;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Home: undefined;
  Wallet: { walletData: WalletData };
  Send: { walletId: string };
  Receive: { address: string };
  Backup: { mnemonic: string };
  Restore: undefined;
  Transactions: { walletId: string };
  QRScanner: { onScan: (data: string) => void };
  Education: undefined;
  Lesson: { lessonId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="Restore" component={RestoreScreen} />
          <Stack.Screen name="Transactions" component={TransactionScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="Education" component={EducationScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
