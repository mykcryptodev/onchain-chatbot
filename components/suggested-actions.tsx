'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { Suggestion } from './elements/suggestion';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isMobile: boolean;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  scrollToBottom,
  isMobile,
}: SuggestedActionsProps) {
  const suggestedActions = [
    'Swap 1 USDC to native ETH on Base',
    'Send 1 USDC to myk.eth on Base',
    'How much ETH does vitalik.eth hold on mainnet?',
    'wen moon?',
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={suggestedAction}
        >
          <Suggestion
            suggestion={suggestedAction}
            onClick={(suggestion) => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestion }],
              });

              // Scroll to show the newly posted message
              // Use a slight delay to allow the message to be rendered first
              // On mobile, use 'auto' for less aggressive scrolling to keep user message visible
              // On desktop, use 'smooth' for better UX
              setTimeout(() => {
                scrollToBottom(isMobile ? 'auto' : 'smooth');
              }, 100);
            }}
            className="text-left w-full h-auto whitespace-normal p-3"
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.isMobile !== nextProps.isMobile) return false;

    return true;
  },
);
