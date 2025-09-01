'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';
import {
  isWalletLoggedIn,
  generatePayload as createPayload,
} from '@/lib/auth-ethereum';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

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
