# Wallet Dropdown Fix Test

## Issue
When creating a new wallet, it's normally created but user needs to close and reopen the app for it to show up in the dropdown.

## Root Cause
The HomeScreen's wallet list (`wallets` state) wasn't being refreshed after wallet creation, so the dropdown showed stale data.

## Fix Applied

### 1. Modified HomeScreen `useFocusEffect`
- Now always calls `loadWallets()` when screen comes into focus
- This ensures wallet list is refreshed after navigating from CreateWalletScreen

### 2. Enhanced `loadWallets()` function  
- Auto-selects first wallet if none selected
- Auto-selects newest wallet when new wallet detected (wallet count increased)

### 3. Fixed navigation flow
- CreateWalletScreen navigates to MainTabs (which contains HomeTab)
- HomeScreen refreshes wallet list via useFocusEffect when focused

## Expected Behavior After Fix
1. User creates new wallet
2. CreateWalletScreen saves wallet to AsyncStorage
3. CreateWalletScreen navigates to MainTabs 
4. HomeScreen comes into focus, triggers useFocusEffect
5. useFocusEffect calls loadWallets()
6. loadWallets() detects new wallet and auto-selects it
7. Wallet dropdown now shows new wallet without restart

## Test Steps
1. Create a new wallet through the CreateWalletScreen
2. After wallet creation, check if new wallet appears in dropdown
3. Verify new wallet is auto-selected
4. Verify no app restart is needed 