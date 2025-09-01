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
import { executeRawTransaction } from '@/lib/thirdweb-actions';
import { toast } from 'sonner';
import { TransactionButton, useActiveAccount } from 'thirdweb/react';
import { prepareTransaction } from 'thirdweb';
import { client } from '@/providers/Thirdweb';
import { defineChain } from 'thirdweb/chains';
import { AlertTriangle } from 'lucide-react';

interface RawTransactionProps {
  transactionData: {
    action?: string;
    intent?: {
      origin_chain_id: number;
      origin_token_address: string;
      destination_chain_id: number;
      destination_token_address: string;
      amount: string;
      sender: string;
      receiver: string;
      max_steps?: number;
    };
    transaction: {
      chain_id: number;
      function: string;
      to: string;
      value: string;
      data: string;
    };
  };
}

export function RawTransaction({ transactionData }: RawTransactionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const activeAccount = useActiveAccount();

  const handleExecuteTransaction = async () => {
    try {
      setIsExecuting(true);

      toast.info('Executing transaction...');
      const result = await executeRawTransaction({
        chainId: transactionData.transaction.chain_id,
        to: transactionData.transaction.to,
        value: transactionData.transaction.value,
        data: transactionData.transaction.data,
      });

      if (result.success) {
        setTransactionResult(result.data);
        setIsCompleted(true);
        toast.success('Transaction executed successfully!');
      } else {
        toast.error(`Failed to execute transaction: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing transaction:', error);
      toast.error(
        'An unexpected error occurred while executing the transaction',
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const formatAmount = (amount: string, decimals = 6) => {
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

  // Prepare transaction for Thirdweb SDK
  const prepareThirdwebTransaction = () => {
    const chain = defineChain(transactionData.transaction.chain_id);

    return prepareTransaction({
      client,
      chain,
      to: transactionData.transaction.to as `0x${string}`,
      value: BigInt(transactionData.transaction.value),
      data: transactionData.transaction.data as `0x${string}`,
    });
  };

  const getTokenSymbol = (address: string) => {
    const tokenMap: Record<string, string> = {
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC', // Base USDC
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': 'ETH', // Native ETH
      '0x0000000000000000000000000000000000000000': 'ETH', // Native ETH
    };
    return tokenMap[address] || `${address.slice(0, 6)}...`;
  };

  if (isCompleted && transactionResult) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Transaction Completed
          </CardTitle>
          <CardDescription>
            Your transaction has been successfully executed.
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
        <CardTitle>
          {transactionData.action === 'sell'
            ? 'Sell Transaction'
            : 'Transaction'}{' '}
          - {transactionData.transaction.function}
        </CardTitle>
        <CardDescription>
          Review and execute the blockchain transaction below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Intent */}
        {transactionData.intent && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Transaction Details:</p>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">From:</span>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatAmount(transactionData.intent.amount)}{' '}
                    {getTokenSymbol(
                      transactionData.intent.origin_token_address,
                    )}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getChainName(transactionData.intent.origin_chain_id)}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-muted-foreground">↓</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">To:</span>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {getTokenSymbol(
                      transactionData.intent.destination_token_address,
                    )}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getChainName(transactionData.intent.destination_chain_id)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Details */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Contract Interaction:</p>
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Contract:</span>
              <span className="text-xs font-mono">
                {transactionData.transaction.to.slice(0, 6)}...
                {transactionData.transaction.to.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Function:</span>
              <span className="text-xs">
                {transactionData.transaction.function}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Chain:</span>
              <Badge variant="outline" className="text-xs">
                {getChainName(transactionData.transaction.chain_id)}
              </Badge>
            </div>
            {transactionData.transaction.value !== '0x0' && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Value:</span>
                <span className="text-xs">
                  {transactionData.transaction.value}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Execute Button */}
        {activeAccount ? (
          // Use Thirdweb TransactionButton when wallet is connected
          <TransactionButton
            transaction={prepareThirdwebTransaction}
            onTransactionSent={(result) => {
              toast.success('Transaction sent!');
              console.log('Transaction sent:', result);
            }}
            onTransactionConfirmed={(receipt) => {
              setTransactionResult({
                transactionHash: receipt.transactionHash,
                transactionId: receipt.transactionHash,
              });
              setIsCompleted(true);
              toast.success('Transaction confirmed!');
              console.log('Transaction confirmed:', receipt);
            }}
            onError={(error) => {
              toast.error(`Transaction failed: ${error.message}`);
              console.error('Transaction error:', error);
            }}
            className="w-full"
          >
            Sign & Execute Transaction
          </TransactionButton>
        ) : (
          // Fallback to server action when no wallet is connected
          <Button
            onClick={handleExecuteTransaction}
            disabled={isExecuting}
            className="w-full"
          >
            {isExecuting ? (
              <>
                <Loader className="mr-2" />
                Executing Transaction...
              </>
            ) : (
              'Sign & Execute Transaction'
            )}
          </Button>
        )}

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              {activeAccount
                ? `This will execute a smart contract transaction using your connected wallet (${activeAccount.address?.slice(0, 6)}...${activeAccount.address?.slice(-4)}). Make sure you have sufficient balance and gas fees on ${getChainName(transactionData.transaction.chain_id)}.`
                : `This will execute a smart contract transaction using your authenticated wallet. Make sure you have sufficient balance and gas fees on ${getChainName(transactionData.transaction.chain_id)}.`}
            </AlertDescription>
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
}
