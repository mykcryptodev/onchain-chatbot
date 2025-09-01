'use server';

import { auth } from '@/app/(auth)/auth';
import { getUserByWallet, createUserWithWallet } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

// Check if user is currently logged in
export async function isLoggedIn(): Promise<boolean> {
  try {
    const session = await auth();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

// Check if specific wallet address is logged in
export async function isWalletLoggedIn(address: string): Promise<boolean> {
  try {
    console.log('Checking wallet login status for:', address);

    const session = await auth();
    console.log(
      'Session:',
      session?.user ? { id: session.user.id, type: session.user.type } : null,
    );

    if (!session?.user) {
      console.log('No session found, returning false');
      return false;
    }

    // Check if the current session belongs to this wallet address
    const users = await getUserByWallet(address);
    console.log('Users found for wallet:', users.length);

    if (users.length === 0) {
      console.log('No user found for wallet address, returning false');
      return false;
    }

    const walletUser = users[0];
    const isMatch = session.user.id === walletUser.id;
    console.log(
      'Session user ID:',
      session.user.id,
      'Wallet user ID:',
      walletUser.id,
      'Match:',
      isMatch,
    );

    return isMatch;
  } catch (error) {
    console.error('Error checking wallet login status:', error);
    return false;
  }
}

// Generate payload for SIWE (Sign-In with Ethereum)
export async function generatePayload({ address }: { address: string }) {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
  const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
  const chainId = '1'; // Ethereum mainnet, can be made configurable

  // Create a nonce for security
  const nonce = generateUUID();
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Return LoginPayload format expected by thirdweb
  return {
    domain,
    address,
    statement: 'Sign in to access your account.',
    uri: origin,
    version: '1',
    chain_id: chainId,
    nonce,
    issued_at: now.toISOString(),
    expiration_time: expirationTime.toISOString(),
    invalid_before: now.toISOString(),
    resources: [],
  };
}

// Handle Ethereum login after signature verification
export async function handleEthereumLogin({
  address,
  signature,
  message,
}: {
  address: string;
  signature: string;
  message: string;
}) {
  try {
    // Parse the SIWE message to validate it
    let parsedMessage: any;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      console.error('Invalid message format - not JSON');
      return {
        success: false,
        error: 'Invalid message format',
      };
    }

    // Basic validation of the SIWE payload
    const now = new Date();
    const expirationTime = new Date(parsedMessage.expiration_time);
    const invalidBefore = new Date(parsedMessage.invalid_before);

    // Check if message is expired
    if (now > expirationTime) {
      console.error('Message has expired');
      return {
        success: false,
        error: 'Message has expired',
      };
    }

    // Check if message is not yet valid
    if (now < invalidBefore) {
      console.error('Message is not yet valid');
      return {
        success: false,
        error: 'Message is not yet valid',
      };
    }

    // Verify the address matches
    if (parsedMessage.address.toLowerCase() !== address.toLowerCase()) {
      console.error('Address mismatch in message');
      return {
        success: false,
        error: 'Address mismatch',
      };
    }

    // Validate the domain matches your application
    const expectedDomain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
    if (parsedMessage.domain !== expectedDomain) {
      return {
        success: false,
        error: 'Domain mismatch',
      };
    }

    // Check if user exists with this wallet address
    const existingUsers = await getUserByWallet(address);

    if (existingUsers.length > 0) {
      // User exists, return their info
      return {
        success: true,
        user: existingUsers[0],
        isNewUser: false,
      };
    } else {
      // Create new user with wallet address
      const email = `${address}@wallet.eth`; // Temporary email format for wallet users
      const [newUser] = await createUserWithWallet(email, address);

      return {
        success: true,
        user: newUser,
        isNewUser: true,
      };
    }
  } catch (error) {
    console.error('Error handling Ethereum login:', error);
    return {
      success: false,
      error: 'Failed to process Ethereum login',
    };
  }
}
