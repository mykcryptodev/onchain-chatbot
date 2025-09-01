'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader } from '@/components/elements/loader';
import {
  executeSendTokenTransaction,
  authenticateWithThirdweb,
} from '@/lib/thirdweb-actions';
import { toast } from '@/components/toast';
import { AlertTriangle, ExternalLink, Send } from 'lucide-react';
import { getBlockExplorerUrl, getChainName } from '@/lib/utils';

interface SendTokenTransactionProps {
  sendData: {
    chainId: number;
    recipients: Array<{
      address: string;
      quantity: string;
    }>;
    tokenAddress?: string;
    tokenId?: string;
    tokenSymbol?: string;
    tokenName?: string;
    tokenDecimals?: number;
    description?: string;
    estimatedGas?: string;
  };
}

export function SendTokenTransaction({ sendData }: SendTokenTransactionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [transactionResult, setTransactionResult] = useState<any>(null);

  const handleExecuteSend = async () => {
    try {
      setIsExecuting(true);

      // First, ensure the user is authenticated with Thirdweb
      toast.info('Authenticating with Thirdweb...');
      const authResult = await authenticateWithThirdweb();

      if (!authResult.success) {
        toast.error(`Authentication failed: ${authResult.error}`);
        return;
      }

      toast.info('Executing token send transaction...');
      const result = await executeSendTokenTransaction({
        chainId: sendData.chainId,
        recipients: sendData.recipients,
        tokenAddress: sendData.tokenAddress,
        tokenId: sendData.tokenId,
      });

      if (result.success) {
        setTransactionResult(result.data);
        setIsCompleted(true);
        toast.success('Token send transaction executed successfully!');
      } else {
        toast.error(`Failed to execute token send: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing token send:', error);
      toast.error(
        'An unexpected error occurred while executing the token send',
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const formatAmount = (amount: string, decimals = 18) => {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');

    return `${wholePart.toString()}.${trimmedFractional}`;
  };

  const isNativeToken =
    !sendData.tokenAddress ||
    sendData.tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ||
    sendData.tokenAddress === '0x0000000000000000000000000000000000000000';

  const getTokenSymbol = () => {
    if (sendData.tokenSymbol) return sendData.tokenSymbol;
    if (isNativeToken) {
      // Return native token symbol based on chain
      switch (sendData.chainId) {
        case 1:
          return 'ETH';
        case 137:
          return 'MATIC';
        case 8453:
          return 'ETH';
        case 56:
          return 'BNB';
        default:
          return 'ETH';
      }
    }
    return 'Token';
  };

  if (isCompleted && transactionResult) {
    return (
      <Card className="w-full max-w-[calc(100vw-1rem)] sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <span className="text-green-600">✓</span>
            Token Send Completed
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your token send transaction has been successfully executed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {transactionResult.transactionId && (
            <div>
              <p className="text-xs sm:text-sm font-medium">Transaction ID:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {transactionResult.transactionId}
              </p>
            </div>
          )}
          {transactionResult.transactionHash && (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium">
                Transaction Hash:
              </p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {transactionResult.transactionHash}
              </p>
              <a
                href={getBlockExplorerUrl(
                  sendData.chainId,
                  transactionResult.transactionHash,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
              >
                <ExternalLink className="size-3 shrink-0" />
                View on {getChainName(sendData.chainId)} Explorer
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[calc(100vw-1rem)] sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Send className="size-4" />
          Token Send Transaction
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {sendData.description || 'Review and execute the token send below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Chain Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          <p className="text-xs sm:text-sm font-medium">Network:</p>
          <Badge variant="secondary" className="text-xs w-fit">
            {getChainName(sendData.chainId)}
          </Badge>
        </div>

        {/* Token Info */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium">Token:</p>
          <div className="p-2 sm:p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">
              {getTokenSymbol()}
              {sendData.tokenName && (
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                  ({sendData.tokenName})
                </span>
              )}
            </p>
            {sendData.tokenAddress && !isNativeToken && (
              <p className="text-xs text-muted-foreground font-mono break-all">
                {sendData.tokenAddress}
              </p>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium">
            Recipients ({sendData.recipients.length}):
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {sendData.recipients.map((recipient, index) => (
              <div
                key={`recipient-${recipient.address}-${index}`}
                className="p-2 sm:p-3 bg-muted rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {recipient.address}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-xs sm:text-sm">
                      {formatAmount(recipient.quantity, sendData.tokenDecimals)}{' '}
                      {getTokenSymbol()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        {sendData.recipients.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium">Total Amount:</p>
            <div className="p-2 sm:p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm break-all">
                {formatAmount(
                  sendData.recipients.reduce(
                    (total, recipient) =>
                      (BigInt(total) + BigInt(recipient.quantity)).toString(),
                    '0',
                  ),
                  sendData.tokenDecimals,
                )}{' '}
                {getTokenSymbol()}
              </p>
            </div>
          </div>
        )}

        {/* Gas Estimate */}
        {sendData.estimatedGas && (
          <div className="text-xs text-muted-foreground break-all">
            Estimated Gas: {sendData.estimatedGas}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecuteSend}
          disabled={isExecuting}
          className="w-full"
        >
          {isExecuting ? (
            <>
              <Loader className="mr-2" />
              Executing Send...
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              Execute Token Send
            </>
          )}
        </Button>

        {/* Warning */}
        <Alert>
          <AlertTriangle className="size-4" />
          <div>
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This transaction will be executed using your connected wallet.
              Make sure you have sufficient balance and gas fees.
            </AlertDescription>
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
}
