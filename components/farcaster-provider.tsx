'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import {
  useConnect,
  useActiveWallet,
  useActiveWalletConnectionStatus,
} from 'thirdweb/react';
import { EIP1193 } from 'thirdweb/wallets';
import { base } from 'thirdweb/chains';
import { client } from '@/providers/Thirdweb';

interface FarcasterContextType {
  triggerHaptic: () => void;
  context: any;
  isSDKLoaded: boolean;
  connectWallet: () => Promise<void>;
  isConnecting: boolean;
  isInFarcaster: boolean;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(
  undefined,
);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const { connect } = useConnect();
  const activeWallet = useActiveWallet();
  const connectionStatus = useActiveWalletConnectionStatus();
  const hasAttemptedConnection = useRef(false);

  const connectWallet = useCallback(async () => {
    if (isConnecting || connectionStatus === 'connecting') return;

    setIsConnecting(true);
    try {
      await connect(async () => {
        // Create a wallet instance from the Farcaster provider
        const wallet = EIP1193.fromProvider({
          provider: sdk.wallet.ethProvider,
        });

        // Trigger the connection
        await wallet.connect({ client, chain: base });

        // Return the wallet to the app context
        return wallet;
      });
    } catch (error) {
      console.error('Failed to connect Farcaster wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, isConnecting, connectionStatus]);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're in a Farcaster environment
        const isInFarcasterEnv =
          typeof window !== 'undefined' &&
          (window.location.hostname.includes('farcaster') ||
            window.navigator.userAgent.includes('Farcaster') ||
            !!sdk);

        setIsInFarcaster(isInFarcasterEnv);

        if (isInFarcasterEnv && sdk) {
          // Get context and initialize SDK
          const farcasterContext = await sdk.context;
          setContext(farcasterContext);

          await sdk.actions.ready({});

          // Auto-connect wallet if available and not already connected
          if (sdk.wallet && !activeWallet && !hasAttemptedConnection.current) {
            hasAttemptedConnection.current = true;
            await connectWallet();
          }
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      initializeFarcaster();
    }
  }, [isSDKLoaded, connectWallet, activeWallet]);

  const triggerHaptic = useCallback(() => {
    // Use Farcaster SDK haptics with fallback to browser API
    try {
      if (isInFarcaster && sdk?.haptics) {
        // Use impact feedback for interactions
        sdk.haptics.impactOccurred('light').catch(() => {
          // Fallback to browser vibration API if SDK haptics fail
          if (
            typeof window !== 'undefined' &&
            'navigator' in window &&
            'vibrate' in navigator
          ) {
            navigator.vibrate(50);
          }
        });
      } else {
        // Fallback to browser vibration API if not in Farcaster
        if (
          typeof window !== 'undefined' &&
          'navigator' in window &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(50);
        }
      }
    } catch (error) {
      // Silent fallback - haptics are not critical functionality
      console.debug('Haptic feedback not available:', error);
    }
  }, [isInFarcaster]);

  return (
    <FarcasterContext.Provider
      value={{
        triggerHaptic,
        context,
        isSDKLoaded,
        connectWallet,
        isConnecting,
        isInFarcaster,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}
