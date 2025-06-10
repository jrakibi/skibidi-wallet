import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/screens/OnboardingScreen';
import WalletScreen from './src/screens/WalletScreen.tsx';
import SendScreen from './src/screens/SendScreen.tsx';
import ReceiveScreen from './src/screens/ReceiveScreen.tsx';
import BackupScreen from './src/screens/BackupScreen.tsx';
import RestoreScreen from './src/screens/RestoreScreen.tsx';
import TransactionScreen from './src/screens/TransactionScreen.tsx';

export type RootStackParamList = {
  Onboarding: undefined;
  Wallet: { walletId: string; address: string; mnemonic: string };
  Send: { walletId: string };
  Receive: { address: string };
  Backup: { mnemonic: string };
  Restore: undefined;
  Transactions: { walletId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="Restore" component={RestoreScreen} />
          <Stack.Screen name="Transactions" component={TransactionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
