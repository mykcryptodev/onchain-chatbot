'use server';

import { auth } from '@/app/(auth)/auth';
import { thirdwebAPI } from './thirdweb-api';

/**
 * Server action to authenticate user with Thirdweb using their wallet
 * This creates a session that allows the user to sign transactions
 */
export async function authenticateWithThirdweb() {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get user's wallet address from session
    const userWalletAddress = session.user.walletAddress;
    if (!userWalletAddress) {
      throw new Error('No wallet address found for user');
    }

    // For Thirdweb API authentication, we need to create a user wallet
    // This will return existing wallet if it already exists
    const result = await thirdwebAPI.makeRequest('/wallets/users', {
      method: 'POST',
      body: JSON.stringify({
        type: 'siwe', // Sign-In with Ethereum
        walletAddress: userWalletAddress,
      }),
    });

    return {
      success: true,
      data: result,
      walletAddress: userWalletAddress,
    };
  } catch (error) {
    console.error('Error authenticating with Thirdweb:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to execute a swap transaction
 */
export async function executeSwapTransaction(swapData: {
  tokenIn: {
    address: string;
    chainId: number;
    amount: string;
  };
  tokenOut: {
    address: string;
    chainId: number;
    minAmount?: string;
  };
  exact?: 'input' | 'output';
}) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get user's wallet address from session
    const userWalletAddress = session.user.walletAddress;
    if (!userWalletAddress) {
      throw new Error('No wallet address found for user');
    }

    // Execute the swap
    const result = await thirdwebAPI.executeSwap({
      from: userWalletAddress,
      tokenIn: swapData.tokenIn,
      tokenOut: swapData.tokenOut,
      exact: swapData.exact || 'input',
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error executing swap transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to sign a message
 */
export async function signMessageAction({
  message,
  chainId = 1,
}: {
  message: string;
  chainId?: number;
}) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get user's wallet address from session
    const userWalletAddress = session.user.walletAddress;
    if (!userWalletAddress) {
      throw new Error('No wallet address found for user');
    }

    // Sign the message
    const result = await thirdwebAPI.signMessage({
      from: userWalletAddress,
      chainId,
      message,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error signing message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to get wallet balance
 */
export async function getWalletBalance({
  chainIds = [1, 8453, 137],
  tokenAddress,
}: {
  chainIds?: number[];
  tokenAddress?: string;
} = {}) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get user's wallet address from session
    const userWalletAddress = session.user.walletAddress;
    if (!userWalletAddress) {
      throw new Error('No wallet address found for user');
    }

    // Get wallet balance
    const result = await thirdwebAPI.getWalletBalance({
      address: userWalletAddress,
      chainId: chainIds,
      tokenAddress,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to execute a raw transaction
 */
export async function executeRawTransaction({
  chainId,
  to,
  value,
  data,
}: {
  chainId: number;
  to: string;
  value: string;
  data: string;
}) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get user's wallet address from session
    const userWalletAddress = session.user.walletAddress;
    if (!userWalletAddress) {
      throw new Error('No wallet address found for user');
    }

    // Execute the raw transaction
    const result = await thirdwebAPI.makeRequest('/transactions/send', {
      method: 'POST',
      body: JSON.stringify({
        chainId,
        from: userWalletAddress,
        transactions: [
          {
            to,
            value,
            data,
          },
        ],
      }),
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error executing raw transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
