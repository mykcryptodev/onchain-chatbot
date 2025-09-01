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
import {
  TransactionButton,
  useActiveAccount,
  useReadContract,
} from 'thirdweb/react';
import { prepareTransaction, getContract, toTokens } from 'thirdweb';
import { client } from '@/providers/Thirdweb';
import { defineChain } from 'thirdweb/chains';
import { approve, allowance, decimals } from 'thirdweb/extensions/erc20';
import { AlertTriangle, CheckCircle } from 'lucide-react';

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
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const activeAccount = useActiveAccount();

  // Check if this is a token swap (not native ETH)
  const isTokenSwap =
    transactionData.intent &&
    transactionData.intent.origin_token_address !==
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
    transactionData.intent.origin_token_address !==
      '0x0000000000000000000000000000000000000000';

  // Get the token contract for approval
  const tokenContract =
    isTokenSwap && transactionData.intent
      ? getContract({
          client,
          chain: defineChain(transactionData.transaction.chain_id),
          address: transactionData.intent.origin_token_address as `0x${string}`,
        })
      : null;

  // Create a dummy contract for when we don't need to fetch data
  const dummyContract = getContract({
    client,
    chain: defineChain(transactionData.transaction.chain_id),
    address: '0x0000000000000000000000000000000000000001' as `0x${string}`, // Use a non-zero address
  });

  // Check current allowance and get token decimals
  const shouldFetchTokenData = tokenContract && isTokenSwap;
  const shouldFetchAllowance = tokenContract && activeAccount;

  const allowanceResult = useReadContract(
    allowance,
    shouldFetchAllowance && tokenContract
      ? {
          contract: tokenContract,
          owner: activeAccount.address,
          spender: transactionData.transaction.to as `0x${string}`,
        }
      : {
          contract: dummyContract,
          owner: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          spender:
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
        },
  );

  const decimalsResult = useReadContract(
    decimals,
    shouldFetchTokenData && tokenContract
      ? { contract: tokenContract }
      : { contract: dummyContract },
  );

  const currentAllowance = shouldFetchAllowance
    ? allowanceResult.data
    : undefined;
  const tokenDecimals = shouldFetchTokenData ? decimalsResult.data : undefined;
  const refetchAllowance = allowanceResult.refetch;

  // Check if approval is needed
  const needsApproval =
    isTokenSwap &&
    transactionData.intent &&
    currentAllowance !== undefined &&
    BigInt(currentAllowance) < BigInt(transactionData.intent.amount);

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

  const formatAmount = (amount: string, useTokenDecimals = false) => {
    // Use dynamically fetched decimals for the origin token, or default to 18
    const decimalsToUse =
      useTokenDecimals && tokenDecimals !== undefined
        ? Number(tokenDecimals)
        : 18;

    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimalsToUse);
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart
      .toString()
      .padStart(decimalsToUse, '0');
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

  // Prepare approval transaction
  const prepareApprovalTransaction = () => {
    if (!tokenContract || !transactionData.intent) {
      throw new Error('Token contract or intent data not available');
    }

    return approve({
      contract: tokenContract,
      spender: transactionData.transaction.to as `0x${string}`,
      amount: toTokens(
        BigInt(transactionData.intent.amount),
        tokenDecimals || 18,
      ),
    });
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
      // Native tokens
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': 'ETH',
      '0x0000000000000000000000000000000000000000': 'ETH',

      // Common tokens (can be expanded as needed)
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC', // Base USDC
      '0xA0b86a33E6441b8F4d6f34E4b6c84b8a2F2e0C2b': 'USDC', // Ethereum USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT', // Ethereum USDT
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'USDC', // Polygon USDC
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 'USDT', // Polygon USDT
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
                    {formatAmount(transactionData.intent.amount, true)}{' '}
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

        {/* Execute Buttons */}
        {activeAccount ? (
          <div className="space-y-3">
            {/* Show approval button if needed */}
            {needsApproval && !isApproved && (
              <div className="space-y-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <AlertTitle>Approval Required</AlertTitle>
                    <AlertDescription>
                      You need to approve{' '}
                      {transactionData.intent &&
                        getTokenSymbol(
                          transactionData.intent.origin_token_address,
                        )}{' '}
                      spending before the swap can execute.
                    </AlertDescription>
                  </div>
                </Alert>
                <TransactionButton
                  transaction={prepareApprovalTransaction}
                  onTransactionSent={() => {
                    toast.info('Approval transaction sent...');
                  }}
                  onTransactionConfirmed={(receipt) => {
                    toast.success('Token spending approved!');
                    setIsApproved(true);
                    refetchAllowance();
                    console.log('Approval confirmed:', receipt);
                  }}
                  onError={(error) => {
                    toast.error(`Approval failed: ${error.message}`);
                    console.error('Approval error:', error);
                  }}
                  className="w-full"
                >
                  Approve{' '}
                  {transactionData.intent &&
                    getTokenSymbol(
                      transactionData.intent.origin_token_address,
                    )}{' '}
                  Spending
                </TransactionButton>
              </div>
            )}

            {/* Show swap button when approval is not needed or already approved */}
            {(!needsApproval ||
              isApproved ||
              currentAllowance === undefined) && (
              <TransactionButton
                transaction={prepareThirdwebTransaction}
                onTransactionSent={(result) => {
                  toast.success('Swap transaction sent!');
                  console.log('Transaction sent:', result);
                }}
                onTransactionConfirmed={(receipt) => {
                  setTransactionResult({
                    transactionHash: receipt.transactionHash,
                    transactionId: receipt.transactionHash,
                  });
                  setIsCompleted(true);
                  toast.success('Swap completed successfully!');
                  console.log('Transaction confirmed:', receipt);
                }}
                onError={(error) => {
                  toast.error(`Swap failed: ${error.message}`);
                  console.error('Transaction error:', error);
                }}
                className="w-full"
                disabled={needsApproval && !isApproved}
              >
                {needsApproval && !isApproved ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Waiting for Approval...
                  </>
                ) : (
                  'Sign & Execute Swap'
                )}
              </TransactionButton>
            )}
          </div>
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
