'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Response } from './elements/response';
import { MessageContent } from './elements/message';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from './elements/tool';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { SwapTransaction } from './swap-transaction';
import { RawTransaction } from './raw-transaction';
import { SendTokenTransaction } from './send-token-transaction';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="px-2 sm:px-4 mx-auto w-full max-w-full sm:max-w-3xl group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex justify-center items-center rounded-full ring-1 size-8 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full min-w-0', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row gap-2 justify-end"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 rounded-full opacity-0 h-fit text-muted-foreground group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <MessageContent
                        data-testid="message-content"
                        className={cn('justify-start items-start text-left', {
                          'bg-primary text-primary-foreground':
                            message.role === 'user',
                          'bg-transparent': message.role === 'assistant',
                        })}
                      >
                        <Response>{sanitizeText(part.text)}</Response>
                      </MessageContent>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-getWeather" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={<Weather weatherAtLocation={part.output} />}
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-createDocument" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <DocumentPreview
                                isReadonly={isReadonly}
                                result={part.output}
                              />
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-updateDocument" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <DocumentToolResult
                                type="update"
                                result={part.output}
                                isReadonly={isReadonly}
                              />
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-requestSuggestions" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <DocumentToolResult
                                type="request-suggestions"
                                result={part.output}
                                isReadonly={isReadonly}
                              />
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              // Handle thirdweb AI tool calls using string matching for now
              // This is a temporary solution until we can properly integrate the types
              if (
                typeof type === 'string' &&
                type.includes('tool-sign_transaction')
              ) {
                // Type guard to ensure we have a tool part
                if ('toolCallId' in part && 'state' in part) {
                  const { toolCallId, state } = part;

                  return (
                    <Tool
                      key={toolCallId || `${message.id}-${index}`}
                      defaultOpen={true}
                    >
                      <ToolHeader
                        type="tool-sign_transaction"
                        state={state || 'output-available'}
                      />
                      <ToolContent>
                        {(state === 'input-available' ||
                          state === 'input-streaming') &&
                          'input' in part && (
                            <>
                              <ToolInput input={part.input} />
                              {/* Show transaction UI from input if it contains transaction data */}
                              {part.input &&
                                typeof part.input === 'object' &&
                                ((('chain_id' in part.input ||
                                  'chainId' in part.input) &&
                                  'to' in part.input &&
                                  'data' in part.input) ||
                                  ('transaction' in part.input &&
                                    'action' in part.input)) && (
                                  <ToolOutput
                                    output={
                                      <RawTransaction
                                        transactionData={
                                          'transaction' in part.input
                                            ? (part.input as any)
                                            : {
                                                transaction: {
                                                  chain_id:
                                                    (part.input as any)
                                                      .chain_id ||
                                                    (part.input as any).chainId,
                                                  function:
                                                    (part.input as any)
                                                      .function ||
                                                    'transaction',
                                                  to: (part.input as any).to,
                                                  value:
                                                    (part.input as any).value ||
                                                    '0x0',
                                                  data: (part.input as any)
                                                    .data,
                                                },
                                                action:
                                                  (part.input as any)
                                                    .function || 'transaction',
                                                intent: (part.input as any)
                                                  .intent,
                                              }
                                        }
                                      />
                                    }
                                    errorText={undefined}
                                  />
                                )}
                            </>
                          )}
                        {state === 'output-available' && 'result' in part && (
                          <ToolOutput
                            output={
                              <div className="space-y-2">
                                {/* Try to detect transaction type and format appropriately */}
                                {part.result &&
                                typeof part.result === 'object' &&
                                ('chain_id' in part.result ||
                                  'chainId' in part.result) &&
                                'to' in part.result &&
                                'data' in part.result ? (
                                  <RawTransaction
                                    transactionData={{
                                      transaction: {
                                        chain_id:
                                          (part.result as any).chain_id ||
                                          (part.result as any).chainId,
                                        function:
                                          (part.result as any).function ||
                                          'transaction',
                                        to: (part.result as any).to,
                                        value:
                                          (part.result as any).value || '0x0',
                                        data: (part.result as any).data,
                                      },
                                      action:
                                        (part.result as any).function ||
                                        'transaction',
                                      intent: (part.result as any).intent,
                                    }}
                                  />
                                ) : part.result &&
                                  typeof part.result === 'object' &&
                                  'recipients' in part.result &&
                                  ('chainId' in part.result ||
                                    'chain_id' in part.result) ? (
                                  <SendTokenTransaction
                                    sendData={part.result as any}
                                  />
                                ) : part.result &&
                                  typeof part.result === 'object' &&
                                  'transaction' in part.result &&
                                  'action' in part.result ? (
                                  <RawTransaction
                                    transactionData={part.result as any}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <p>Transaction data:</p>
                                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-w-full">
                                      {JSON.stringify(part.result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            }
                            errorText={undefined}
                          />
                        )}
                      </ToolContent>
                    </Tool>
                  );
                }

                // Fallback for cases without proper tool structure
                return (
                  <Tool key={`${message.id}-${index}`} defaultOpen={true}>
                    <ToolHeader
                      type="tool-sign_transaction"
                      state="output-available"
                    />
                    <ToolContent>
                      <ToolOutput
                        output={
                          <div className="space-y-2">
                            <p>
                              Thirdweb AI transaction tool detected. This
                              feature is being integrated.
                            </p>
                            <div className="p-3 bg-muted rounded-lg">
                              <p>
                                Transaction tools will be available once the
                                integration is complete.
                              </p>
                            </div>
                          </div>
                        }
                        errorText={undefined}
                      />
                    </ToolContent>
                  </Tool>
                );
              }

              if (typeof type === 'string' && type.includes('tool-sign_swap')) {
                // Type guard to ensure we have a tool part
                if ('toolCallId' in part && 'state' in part) {
                  const { toolCallId, state } = part;

                  return (
                    <Tool
                      key={toolCallId || `${message.id}-${index}`}
                      defaultOpen={true}
                    >
                      <ToolHeader
                        type="tool-sign_swap"
                        state={state || 'output-available'}
                      />
                      <ToolContent>
                        {(state === 'input-available' ||
                          state === 'input-streaming') &&
                          'input' in part && (
                            <>
                              <ToolInput input={part.input} />
                              {/* Show transaction UI from input if it contains transaction data */}
                              {part.input &&
                                typeof part.input === 'object' &&
                                'transaction' in part.input &&
                                'action' in part.input && (
                                  <ToolOutput
                                    output={
                                      <RawTransaction
                                        transactionData={part.input as any}
                                      />
                                    }
                                    errorText={undefined}
                                  />
                                )}
                            </>
                          )}
                        {(state === 'output-available' ||
                          state === 'input-streaming') &&
                          'output' in part && (
                            <ToolOutput
                              output={
                                part.output &&
                                typeof part.output === 'object' ? (
                                  // Check if it's the new raw transaction format
                                  'transaction' in part.output &&
                                  'action' in part.output ? (
                                    <RawTransaction
                                      transactionData={part.output as any}
                                    />
                                  ) : // Check if it's the old swap format
                                  'tokenIn' in part.output &&
                                    'tokenOut' in part.output ? (
                                    <SwapTransaction
                                      swapData={part.output as any}
                                    />
                                  ) : (
                                    <div className="space-y-2">
                                      <p>Processing transaction data...</p>
                                      <div className="p-3 bg-muted rounded-lg">
                                        <pre className="text-xs text-muted-foreground overflow-x-auto max-w-full">
                                          {JSON.stringify(part.output, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="space-y-2">
                                    <p>Preparing transaction...</p>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        {typeof part.output === 'string'
                                          ? part.output
                                          : 'Transaction data is being processed.'}
                                      </p>
                                    </div>
                                  </div>
                                )
                              }
                              errorText={undefined}
                            />
                          )}
                      </ToolContent>
                    </Tool>
                  );
                }

                // Fallback for non-tool parts
                return (
                  <Tool key={`${message.id}-${index}`} defaultOpen={true}>
                    <ToolHeader
                      type="tool-sign_swap"
                      state="output-available"
                    />
                    <ToolContent>
                      <ToolOutput
                        output={
                          <div className="space-y-2">
                            <p>Swap tool detected but data is not available.</p>
                          </div>
                        }
                        errorText={undefined}
                      />
                    </ToolContent>
                  </Tool>
                );
              }

              if (
                typeof type === 'string' &&
                type.includes('tool-monitor_transaction')
              ) {
                return (
                  <Tool key={`${message.id}-${index}`} defaultOpen={true}>
                    <ToolHeader
                      type="tool-monitor_transaction"
                      state="output-available"
                    />
                    <ToolContent>
                      <ToolOutput
                        output={
                          <div className="space-y-2">
                            <p>
                              Thirdweb AI transaction monitoring detected. This
                              feature is being integrated.
                            </p>
                            <div className="p-3 bg-muted rounded-lg">
                              <p>
                                Transaction monitoring will be available once
                                the integration is complete.
                              </p>
                            </div>
                          </div>
                        }
                        errorText={undefined}
                      />
                    </ToolContent>
                  </Tool>
                );
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="px-2 sm:px-4 mx-auto w-full max-w-full sm:max-w-3xl group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="flex justify-center items-center rounded-full ring-1 size-8 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
