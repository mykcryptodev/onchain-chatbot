'use client';

import {
  useActiveWallet,
  useActiveWalletConnectionStatus,
} from 'thirdweb/react';
import { useFarcaster } from './farcaster-provider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Wallet, Zap } from 'lucide-react';

export function FarcasterWalletStatus() {
  const { isInFarcaster, connectWallet, isConnecting, triggerHaptic } =
    useFarcaster();
  const activeWallet = useActiveWallet();
  const connectionStatus = useActiveWalletConnectionStatus();

  // Only show this component if we're in a Farcaster environment
  if (!isInFarcaster) {
    return null;
  }

  const handleConnectClick = async () => {
    triggerHaptic();
    await connectWallet();
  };

  const handleHapticTest = () => {
    triggerHaptic();
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          <Zap className="size-3 mr-1" />
          Farcaster
        </Badge>

        {activeWallet ? (
          <Badge variant="default" className="text-xs">
            <Wallet className="size-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleConnectClick}
            disabled={isConnecting || connectionStatus === 'connecting'}
            className="text-xs h-6"
          >
            {isConnecting || connectionStatus === 'connecting' ? (
              'Connecting...'
            ) : (
              <>
                <Wallet className="size-3 mr-1" />
                Connect Wallet
              </>
            )}
          </Button>
        )}
      </div>

      {/* Test haptic feedback button - remove in production */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleHapticTest}
        className="text-xs h-6 px-2"
        title="Test haptic feedback"
      >
        <Zap className="size-3" />
      </Button>
    </div>
  );
}
