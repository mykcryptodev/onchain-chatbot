import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';

export const metadata: Metadata = {
  title: 'Chat - Onchain Chatbot',
  description:
    'Start chatting with your AI assistant for blockchain operations, token swaps, and Web3 interactions.',
  openGraph: {
    title: 'Chat - Onchain Chatbot',
    description:
      'Start chatting with your AI assistant for blockchain operations, token swaps, and Web3 interactions.',
    images: ['/opengraph-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://chat.vercel.ai/opengraph-image.png',
      button: {
        title: '🤖 Start Chat',
        action: {
          type: 'launch_frame',
          name: 'Onchain Chatbot',
          url: 'https://chat.vercel.ai',
        },
      },
    }),
  },
};

export default async function Page() {
  const session = await auth();

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
