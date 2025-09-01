'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from '@/components/toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useFarcaster } from '@/components/farcaster-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session | null;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();
  const { triggerHaptic } = useFarcaster();

  const [input, setInput] = useState<string>('');
  const [hasTriggeredResponseHaptic, setHasTriggeredResponseHaptic] =
    useState<boolean>(false);

  // Test function to manually trigger haptics
  const testHaptic = () => {
    console.debug('Manual haptic test triggered from chat');
    triggerHaptic('medium');
  };

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            selectedChains: selectedChainsRef.current,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      console.debug(
        'onData called with:',
        dataPart,
        'hasTriggeredResponseHaptic:',
        hasTriggeredResponseHaptic,
      );
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));

      // Trigger haptic feedback when AI starts responding (only once per response)
      // We trigger on the first data chunk regardless of status since onData means streaming has started
      if (!hasTriggeredResponseHaptic) {
        console.debug('Bot started responding, triggering haptic feedback');
        console.debug('triggerHaptic function:', triggerHaptic);
        triggerHaptic();
        setHasTriggeredResponseHaptic(true);
        console.debug('Haptic triggered, flag set to true');
      } else {
        console.debug('Haptic already triggered for this response');
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // Reset the haptic trigger flag when the response finishes
      setHasTriggeredResponseHaptic(false);
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast.error(error.message);
      }
      // Reset the haptic trigger flag when there's an error
      setHasTriggeredResponseHaptic(false);
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [selectedChains, setSelectedChains] = useState<number[]>([8453]); // Default to Base
  const selectedChainsRef = useRef(selectedChains);

  // Keep ref in sync with state
  useEffect(() => {
    selectedChainsRef.current = selectedChains;
  }, [selectedChains]);

  // Reset haptic flag when status changes to submitted (new message sent)
  useEffect(() => {
    console.debug('Chat status changed:', status);
    if (status === 'submitted') {
      setHasTriggeredResponseHaptic(false);
    }
    // Try triggering haptic when status changes to streaming
    if (status === 'streaming' && !hasTriggeredResponseHaptic) {
      console.debug('Status changed to streaming, triggering haptic feedback');
      triggerHaptic();
      setHasTriggeredResponseHaptic(true);
    }
  }, [status, hasTriggeredResponseHaptic, triggerHaptic]);

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background overflow-hidden">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="sticky bottom-0 flex gap-2 px-4 pb-4 mx-auto w-full max-w-full bg-background md:pb-6 md:max-w-3xl z-[1] border-t-0">
          {/* Temporary test button for haptics - remove after debugging */}
          <button
            type="button"
            onClick={testHaptic}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            style={{ fontSize: '10px', minWidth: 'auto' }}
          >
            Test Haptic
          </button>
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
              selectedChains={selectedChains}
              setSelectedChains={setSelectedChains}
              session={session}
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        selectedChains={selectedChains}
        setSelectedChains={setSelectedChains}
        session={session}
      />
    </>
  );
}
