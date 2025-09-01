'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    initializeFarcaster();
  }, []);

  return <>{children}</>;
}
