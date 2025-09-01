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
import { Loader } from '@/components/elements/loader';
import {
  executeSwapTransaction,
  authenticateWithThirdweb,
} from '@/lib/thirdweb-actions';
import { toast } from 'sonner';

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

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      8453: 'Base',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  if (isCompleted && transactionResult) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Swap Completed
          </CardTitle>
          <CardDescription>
            Your swap transaction has been successfully executed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactionResult.transactionId && (
            <div>
              <p className="text-sm font-medium">Transaction ID:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {transactionResult.transactionId}
              </p>
            </div>
          )}
          {transactionResult.transactionHash && (
            <div>
              <p className="text-sm font-medium">Transaction Hash:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {transactionResult.transactionHash}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Token Swap Transaction</CardTitle>
        <CardDescription>
          {swapData.description || 'Review and execute the token swap below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <p className="text-sm font-medium">From:</p>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">
                {formatAmount(swapData.tokenIn.amount)}{' '}
                {swapData.tokenIn.symbol || 'Token'}
              </p>
              {swapData.tokenIn.name && (
                <p className="text-xs text-muted-foreground">
                  {swapData.tokenIn.name}
                </p>
              )}
            </div>
            <Badge variant="secondary">
              {getChainName(swapData.tokenIn.chainId)}
            </Badge>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-muted-foreground">↓</div>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <p className="text-sm font-medium">To:</p>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">
                {swapData.tokenOut.symbol || 'Token'}
                {swapData.tokenOut.minAmount && (
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    (min: {formatAmount(swapData.tokenOut.minAmount)})
                  </span>
                )}
              </p>
              {swapData.tokenOut.name && (
                <p className="text-xs text-muted-foreground">
                  {swapData.tokenOut.name}
                </p>
              )}
            </div>
            <Badge variant="secondary">
              {getChainName(swapData.tokenOut.chainId)}
            </Badge>
          </div>
        </div>

        {/* Gas Estimate */}
        {swapData.estimatedGas && (
          <div className="text-xs text-muted-foreground">
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
        <div className="text-xs text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ Important:
          </p>
          <p className="text-yellow-700 dark:text-yellow-300">
            This transaction will be executed using your connected wallet. Make
            sure you have sufficient balance and gas fees.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
