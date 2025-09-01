# Thirdweb Integration for Transaction Signing

This document describes the integration of Thirdweb HTTP API for handling blockchain transactions in the AI chatbot.

## Overview

The integration allows users to:
1. Chat with the Thirdweb AI to get swap recommendations
2. Sign and execute transactions directly through the UI
3. Monitor transaction status and completion

## Components Added

### 1. `lib/thirdweb-api.ts`
- **ThirdwebAPIClient**: Main client for interacting with Thirdweb HTTP API
- **Server Actions** (in `lib/thirdweb-actions.ts`):
  - `executeSwapTransaction()`: Execute structured token swaps
  - `executeRawTransaction()`: Execute raw blockchain transactions
  - `signMessageAction()`: Sign arbitrary messages
  - `getWalletBalance()`: Get wallet balances
  - `authenticateWithThirdweb()`: Authenticate user with Thirdweb

### 2. `components/swap-transaction.tsx`
- React component that renders structured swap transaction UI
- Handles user confirmation and execution for token swaps
- Shows transaction progress and results
- Includes proper error handling and user feedback

### 3. `components/raw-transaction.tsx`
- React component that renders raw blockchain transaction UI
- **Smart wallet detection**: Uses Thirdweb `TransactionButton` when user has connected wallet, falls back to server actions otherwise
- Handles any smart contract transaction with raw data
- Shows transaction details, contract interaction info, and intent
- Supports the new Thirdweb AI transaction format

### 4. Updated `components/message.tsx`
- Enhanced the `tool-sign_swap` handler to detect and use appropriate components
- Supports both structured swap data (`SwapTransaction`) and raw transaction data (`RawTransaction`)
- Proper TypeScript typing for tool parts
- Fallback handling for different data formats

### 5. Updated `app/(auth)/auth.ts`
- Added `walletAddress` to session and JWT types
- Ensures wallet address is available throughout the application
- Proper null/undefined handling for TypeScript compatibility

### 6. Zapper API Integration
- **`lib/zapper-api.ts`**: Utility functions for resolving contract addresses to human-readable names
- **`components/contract-address-display.tsx`**: React component that displays contract addresses with resolved names
- **`app/(chat)/api/address-info/route.ts`**: API endpoint for fetching address information
- **Enhanced transaction display**: Shows human-readable names for contract addresses in transaction signatures

### 7. Enhanced Token Display
- **Dynamic Token Symbols**: Uses Thirdweb's built-in `TokenProvider` and `TokenSymbol` components
- **Universal Support**: Works with any ERC-20 token and native tokens automatically
- **Optimized Performance**: Leverages Thirdweb's caching and optimization strategies

## Environment Variables Required

```bash
# Thirdweb Integration
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key_here
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Domain configuration for SIWE
NEXT_PUBLIC_DOMAIN=localhost:3000
NEXT_PUBLIC_ORIGIN=http://localhost:3000

# Zapper API for contract address resolution
ZAPPER_API_KEY=your_zapper_api_key_here
```

## How It Works

1. **User Authentication**: Users sign in with their Ethereum wallet using SIWE
2. **AI Chat**: Users can ask the Thirdweb AI for swap recommendations
3. **Transaction Preparation**: When the AI suggests a swap, it returns structured data
4. **UI Rendering**: The `SwapTransaction` component renders the swap details
5. **User Confirmation**: User reviews and confirms the transaction
6. **Thirdweb Authentication**: System authenticates with Thirdweb API using user's wallet
7. **Transaction Execution**: Swap is executed via Thirdweb's `/tokens/swap` endpoint
8. **Status Updates**: User receives real-time feedback on transaction status

## API Endpoints Used

- `POST /v1/wallets/users` - Create/get user wallet for authentication
- `POST /v1/tokens/swap` - Execute token swaps
- `POST /v1/wallets/sign-message` - Sign messages
- `POST /v1/wallets/send` - Send tokens
- `POST /v1/contracts/write` - Execute contract transactions
- `GET /v1/wallets/balance` - Get wallet balances
- `GET /v1/wallets/transactions` - Get transaction history

## Security Features

1. **Server-Side Execution**: All API calls are made server-side to protect secret keys
2. **Session Validation**: User authentication is verified before any transaction
3. **Wallet Ownership**: Only the authenticated wallet owner can sign transactions
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **Type Safety**: Full TypeScript integration for compile-time safety

## Testing

To test the integration:

1. Ensure environment variables are set
2. Start the development server: `npm run dev`
3. Connect with an Ethereum wallet
4. Ask the AI: "I want to swap 100 USDC for ETH on Ethereum"
5. The AI should return a swap transaction UI
6. Click "Execute Swap" to test the full flow

## Future Enhancements

- Support for more transaction types (NFT transfers, contract interactions)
- Transaction simulation before execution
- Gas estimation and optimization
- Multi-chain transaction support
- Batch transaction execution
- Transaction history and analytics

## Smart Wallet Integration (Latest Update)

The system now intelligently detects whether a user has connected their own wallet using Thirdweb React SDK:

### **Wallet Detection Logic:**
- **Connected Wallet**: Uses Thirdweb React SDK's `TransactionButton` component for direct wallet signing
- **No Wallet**: Falls back to server-side execution using Thirdweb HTTP API  
- **Seamless UX**: Users see the same UI regardless of their wallet connection status

### **Benefits of TransactionButton:**
- ✅ **Direct wallet signing**: No need for wallet authentication with Thirdweb API
- ✅ **Better UX**: Native wallet prompts and transaction confirmations  
- ✅ **Gas estimation**: Automatic gas estimation and fee display
- ✅ **Error handling**: Built-in error handling for failed transactions
- ✅ **Transaction tracking**: Automatic transaction status updates

### **Implementation Details:**
```typescript
// Detects connected wallet
const activeAccount = useActiveAccount();

// Uses TransactionButton when wallet is connected
{activeAccount ? (
  <TransactionButton
    transaction={prepareThirdwebTransaction}
    onTransactionConfirmed={(receipt) => {
      // Handle success
    }}
  >
    Sign & Execute Transaction
  </TransactionButton>
) : (
  // Fallback to server action
  <Button onClick={handleExecuteTransaction}>
    Sign & Execute Transaction
  </Button>
)}
```

This approach provides the best user experience while maintaining compatibility with both connected and non-connected wallet scenarios.
