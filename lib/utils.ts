import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';
import { formatISO } from 'date-fns';
import {
  ethereum,
  base,
  polygon,
  bsc,
  avalanche,
  arbitrum,
  optimism,
  celo,
  gnosis,
  fantom,
  zkSync,
  linea,
  scroll,
} from 'thirdweb/chains';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Get the block explorer URL for a given chain and transaction hash using thirdweb chains
 */
export function getBlockExplorerUrl(chainId: number, txHash: string): string {
  // Map chain IDs to thirdweb chain objects
  const chainMap = new Map([
    [1, ethereum],
    [8453, base],
    [137, polygon],
    [56, bsc],
    [43114, avalanche],
    [42161, arbitrum],
    [10, optimism],
    [42220, celo],
    [100, gnosis],
    [250, fantom],
    [324, zkSync],
    [59144, linea],
    [534352, scroll],
  ]);

  const chain = chainMap.get(chainId);
  if (chain?.blockExplorers?.[0]?.url) {
    return `${chain.blockExplorers[0].url}/tx/${txHash}`;
  }

  // Fallback to Etherscan for unknown chains
  return `https://etherscan.io/tx/${txHash}`;
}

/**
 * Get the chain name for display purposes using thirdweb chains
 */
export function getChainName(chainId: number): string {
  // Map chain IDs to thirdweb chain objects
  const chainMap = new Map([
    [1, ethereum],
    [8453, base],
    [137, polygon],
    [56, bsc],
    [43114, avalanche],
    [42161, arbitrum],
    [10, optimism],
    [42220, celo],
    [100, gnosis],
    [250, fantom],
    [324, zkSync],
    [59144, linea],
    [534352, scroll],
  ]);

  const chain = chainMap.get(chainId);
  if (chain?.name) {
    return chain.name;
  }

  // Fallback for unknown chains
  return `Chain ${chainId}`;
}
