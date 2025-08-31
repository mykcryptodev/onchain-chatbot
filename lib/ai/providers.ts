import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { createThirdwebAI } from '@thirdweb-dev/ai-sdk-provider';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// Create thirdweb AI instance
const thirdwebAI = createThirdwebAI({
  secretKey: process.env.THIRDWEB_SECRET_KEY || '',
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
        // Add thirdweb AI model
        'thirdweb-ai': thirdwebAI.chat({
          context: {
            chain_ids: [1, 8453, 137], // Ethereum, Base, Polygon
            // from: omitted - will be provided by user when needed
            auto_execute_transactions: false, // Let user confirm transactions
          },
        }),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });

// Export thirdweb AI instance for use in API routes
export { thirdwebAI };
