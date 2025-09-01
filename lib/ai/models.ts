export const DEFAULT_CHAT_MODEL: string = 'thirdweb-ai';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'thirdweb-ai',
    name: 'Thirdweb AI',
    description:
      'AI assistant for blockchain interactions, swaps, and transactions',
  },
];
