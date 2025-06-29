import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import WalletManagerScreen from './src/screens/WalletManagerScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import BackupScreen from './src/screens/BackupScreen';
import RestoreScreen from './src/screens/RestoreScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import EducationScreen from './src/screens/EducationScreen';
import LessonScreen from './src/screens/LessonScreen';
import CourseContentScreen from './src/screens/CourseContentScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import LightningScreen from './src/screens/LightningScreen';
import SeedGameScreen from './src/screens/SeedGameScreen';
import TabNavigator from './src/navigation/TabNavigator';

export type WalletData = {
  id: string;
  name: string;
  address: string;
  mnemonic: string;
  balance: number;
  createdAt: string;
  iconIndex?: number;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Home: { selectedWallet?: WalletData } | undefined;
  WalletManager: undefined;
  CreateWallet: undefined;
  SeedGame: { seedWords: string[]; onComplete: (words: string[]) => void };
  Send: { walletId: string; walletMnemonic: string };
  Receive: { address: string };
  Backup: { mnemonic: string };
  Restore: undefined;
  Transactions: { walletId: string; walletMnemonic: string };
  Lightning: { walletId: string; walletMnemonic: string; scannedInvoice?: string };
  QRScanner: { walletId?: string; walletMnemonic?: string; onScan?: (data: string) => void };
  Education: undefined;
  Lesson: { lessonId: string };
  CourseContent: { courseId: string; courseTitle: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="WalletManager" component={WalletManagerScreen} />
          <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
          <Stack.Screen name="SeedGame" component={SeedGameScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="Restore" component={RestoreScreen} />
          <Stack.Screen name="Transactions" component={TransactionScreen} />
          <Stack.Screen name="Lightning" component={LightningScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="Education" component={EducationScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
          <Stack.Screen name="CourseContent" component={CourseContentScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
