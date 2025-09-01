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
  executeSwapTransaction,
  authenticateWithThirdweb,
} from '@/lib/thirdweb-actions';
import { toast } from '@/components/toast';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { getBlockExplorerUrl, getChainName } from '@/lib/utils';

interface SwapTransactionProps {
  swapData: {
    tokenIn: {
      address: string;
      chainId: number;
      amount: string;
      symbol?: string;
      name?: string;
    };
    tokenOut: {
      address: string;
      chainId: number;
      minAmount?: string;
      symbol?: string;
      name?: string;
    };
    exact?: 'input' | 'output';
    description?: string;
    estimatedGas?: string;
  };
}

export function SwapTransaction({ swapData }: SwapTransactionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [transactionResult, setTransactionResult] = useState<any>(null);

  const handleExecuteSwap = async () => {
    try {
      setIsExecuting(true);

      // First, ensure the user is authenticated with Thirdweb
      toast.info('Authenticating with Thirdweb...');
      const authResult = await authenticateWithThirdweb();

      if (!authResult.success) {
        toast.error(`Authentication failed: ${authResult.error}`);
        return;
      }

      toast.info('Executing swap transaction...');
      const result = await executeSwapTransaction({
        tokenIn: swapData.tokenIn,
        tokenOut: swapData.tokenOut,
        exact: swapData.exact,
      });

      if (result.success) {
        setTransactionResult(result.data);
        setIsCompleted(true);
        toast.success('Swap transaction executed successfully!');
      } else {
        toast.error(`Failed to execute swap: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      toast.error('An unexpected error occurred while executing the swap');
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

  if (isCompleted && transactionResult) {
    return (
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <span className="text-green-600">✓</span>
            Swap Completed
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your swap transaction has been successfully executed.
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
                  swapData.tokenIn.chainId,
                  transactionResult.transactionHash,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
              >
                <ExternalLink className="size-3 shrink-0" />
                View on {getChainName(swapData.tokenIn.chainId)} Explorer
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">
          Token Swap Transaction
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {swapData.description || 'Review and execute the token swap below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium">From:</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-muted rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm break-all">
                {formatAmount(swapData.tokenIn.amount)}{' '}
                {swapData.tokenIn.symbol || 'Token'}
              </p>
              {swapData.tokenIn.name && (
                <p className="text-xs text-muted-foreground break-all">
                  {swapData.tokenIn.name}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs w-fit">
              {getChainName(swapData.tokenIn.chainId)}
            </Badge>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-muted-foreground text-sm">↓</div>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-medium">To:</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-muted rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm break-all">
                {swapData.tokenOut.symbol || 'Token'}
                {swapData.tokenOut.minAmount && (
                  <span className="text-xs text-muted-foreground">
                    {' '}
                    (min: {formatAmount(swapData.tokenOut.minAmount)})
                  </span>
                )}
              </p>
              {swapData.tokenOut.name && (
                <p className="text-xs text-muted-foreground break-all">
                  {swapData.tokenOut.name}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs w-fit">
              {getChainName(swapData.tokenOut.chainId)}
            </Badge>
          </div>
        </div>

        {/* Gas Estimate */}
        {swapData.estimatedGas && (
          <div className="text-xs text-muted-foreground break-all">
            Estimated Gas: {swapData.estimatedGas}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecuteSwap}
          disabled={isExecuting}
          className="w-full"
        >
          {isExecuting ? (
            <>
              <Loader className="mr-2" />
              Executing Swap...
            </>
          ) : (
            'Execute Swap'
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
