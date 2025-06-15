import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/screens/OnboardingScreen';
import WalletManagerScreen from './src/screens/WalletManagerScreen';
import WalletScreen from './src/screens/WalletScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import BackupScreen from './src/screens/BackupScreen';
import RestoreScreen from './src/screens/RestoreScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import LightningSendScreen from './src/screens/LightningSendScreen';
import LightningReceiveScreen from './src/screens/LightningReceiveScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

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
  WalletManager: undefined;
  Wallet: { walletData: WalletData };
  Send: { walletId: string };
  Receive: { address: string };
  Backup: { mnemonic: string };
  Restore: undefined;
  Transactions: { walletId: string };
  LightningSend: undefined;
  LightningReceive: undefined;
  QRScanner: { onScan: (data: string) => void };
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
          <Stack.Screen name="WalletManager" component={WalletManagerScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="Restore" component={RestoreScreen} />
          <Stack.Screen name="Transactions" component={TransactionScreen} />
          <Stack.Screen name="LightningSend" component={LightningSendScreen} />
          <Stack.Screen name="LightningReceive" component={LightningReceiveScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
