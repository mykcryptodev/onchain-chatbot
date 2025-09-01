'use server';

import {
  isWalletLoggedIn,
  generatePayload as createPayload,
} from '@/lib/auth-ethereum';

import { signIn } from './auth';

// Ethereum authentication functions for thirdweb ConnectButton
export async function isLoggedIn(address: string): Promise<boolean> {
  try {
    console.log('isLoggedIn called with address:', address);

    const result = await isWalletLoggedIn(address);
    console.log('isWalletLoggedIn result:', result);

    // Ensure we always return a boolean
    const booleanResult = Boolean(result);
    console.log('Final boolean result:', booleanResult);
    return booleanResult;
  } catch (error) {
    console.error('Error in isLoggedIn:', error);
    return false;
  }
}

export async function generatePayload({ address }: { address: string }) {
  return await createPayload({ address });
}

export async function loginWithEthereum(params: {
  payload: any;
  signature: string;
}) {
  try {
    const result = await signIn('ethereum', {
      address: params.payload.address,
      signature: params.signature,
      message: JSON.stringify(params.payload),
      redirect: false,
    });

    console.log('signIn result:', result);

    // The signIn function may return a redirect URL even when successful
    // We'll trust that if we got here without throwing, the authentication worked
    return result;
  } catch (error) {
    console.error('Ethereum login error:', error);
    throw error;
  }
}
