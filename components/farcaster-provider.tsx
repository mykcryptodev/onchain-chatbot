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
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
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

  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      // Use Farcaster SDK haptics with fallback to browser API
      console.debug('Triggering haptic:', {
        type,
        isInFarcaster,
        hasSDK: !!sdk,
        hasHaptics: !!sdk?.haptics,
      });
      try {
        if (isInFarcaster && sdk?.haptics) {
          // Use impact feedback for interactions with different intensities
          console.debug('Using Farcaster SDK haptics');
          sdk.haptics.impactOccurred(type).catch((error) => {
            console.debug(
              'Farcaster haptics failed, falling back to browser vibration:',
              error,
            );
            // Fallback to browser vibration API if SDK haptics fail
            const vibrationPattern =
              type === 'heavy' ? 100 : type === 'medium' ? 75 : 50;
            if (
              typeof window !== 'undefined' &&
              'navigator' in window &&
              'vibrate' in navigator
            ) {
              navigator.vibrate(vibrationPattern);
            }
          });
        } else {
          // Fallback to browser vibration API if not in Farcaster
          console.debug('Using browser vibration API fallback');
          const vibrationPattern =
            type === 'heavy' ? 100 : type === 'medium' ? 75 : 50;
          if (
            typeof window !== 'undefined' &&
            'navigator' in window &&
            'vibrate' in navigator
          ) {
            console.debug('Vibrating with pattern:', vibrationPattern);
            navigator.vibrate(vibrationPattern);
          } else {
            console.debug('Browser vibration not supported');
          }
        }
      } catch (error) {
        // Silent fallback - haptics are not critical functionality
        console.debug('Haptic feedback not available:', error);
      }
    },
    [isInFarcaster, sdk],
  );

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
    // Instead of throwing an error that can cause 500 errors during SSR,
    // provide a default context with safe fallbacks
    return {
      triggerHaptic: () => {}, // No-op function
      context: null,
      isSDKLoaded: false,
      connectWallet: async () => {}, // No-op function
      isConnecting: false,
      isInFarcaster: false,
    };
  }
  return context;
}
