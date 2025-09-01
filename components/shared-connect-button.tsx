'use client';

import { useTheme } from 'next-themes';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/providers/Thirdweb';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  isLoggedIn,
  generatePayload,
  loginWithEthereum,
} from '@/app/(auth)/actions';

interface SharedConnectButtonProps {
  /** Custom styling for the connect button */
  connectButtonProps?: {
    label?: string;
    style?: React.CSSProperties;
  };
  /** Whether to wait for theme to be mounted before rendering */
  waitForMount?: boolean;
}

export function SharedConnectButton({
  connectButtonProps,
  waitForMount = false,
}: SharedConnectButtonProps) {
  const { resolvedTheme } = useTheme();
  const { update: updateSession } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If waitForMount is true and component isn't mounted yet, don't render
  if (waitForMount && !mounted) {
    return null;
  }

  const theme =
    (waitForMount && mounted && resolvedTheme === 'light') ||
    (!waitForMount && resolvedTheme === 'light')
      ? 'light'
      : 'dark';

  return (
    <ConnectButton
      client={client}
      theme={theme}
      connectButton={connectButtonProps}
      auth={{
        isLoggedIn: async (address) => {
          try {
            const result = await isLoggedIn(address);
            return Boolean(result);
          } catch (error) {
            console.error('Error in ConnectButton isLoggedIn:', error);
            return false;
          }
        },
        doLogin: async (params) => {
          await loginWithEthereum(params);

          // Give NextAuth a moment to set the session cookie
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force session update after login
          await updateSession();
          router.refresh();
        },
        getLoginPayload: async ({ address }) => generatePayload({ address }),
        doLogout: async () => {
          await signOut({ redirectTo: '/' });
        },
      }}
    />
  );
}
