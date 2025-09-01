'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import {
  login,
  loginWithEthereum,
  isLoggedIn,
  generatePayload,
  type LoginActionState,
} from '../actions';
import { signOut, useSession } from 'next-auth/react';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/providers/Thirdweb';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <ConnectButton
            client={client}
            auth={{
              isLoggedIn: async (address) => {
                console.log('checking if logged in!', { address });
                try {
                  const result = await isLoggedIn(address);
                  console.log('isLoggedIn result from ConnectButton:', result);
                  return Boolean(result);
                } catch (error) {
                  console.error('Error in ConnectButton isLoggedIn:', error);
                  return false;
                }
              },
              doLogin: async (params) => {
                console.log('logging in with Ethereum!', params);
                await loginWithEthereum(params);

                // Give NextAuth a moment to set the session cookie
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Force session update after login
                await updateSession();
                router.refresh();
              },
              getLoginPayload: async ({ address }) =>
                generatePayload({ address }),
              doLogout: async () => {
                console.log('logging out!');
                await signOut();
              },
            }}
          />
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
