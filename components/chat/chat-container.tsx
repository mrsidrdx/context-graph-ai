'use client';

import { useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/stores/chat';
import { useAuthStore } from '@/lib/stores/auth';
import { authenticatedFetch } from '@/lib/auth/token';
import { ChatMessage } from './message';
import { ChatInput } from './chat-input';
import { ContextPanel } from './context-panel';
import { ChatSidebar } from './sidebar';
import { motion } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, GraphContext, EnrichedContext } from '@/lib/types';
import type { IMessage } from '@/lib/models/conversation';

interface ChatContainerProps {
  conversationId?: string;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<string>('');
  const streamBufferRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');
  const router = useRouter();

  const {
    messages,
    isStreaming,
    currentStreamContent,
    context,
    enrichedContext,
    showContextPanel,
    currentConversationId,
    setCurrentConversation,
    addMessage,
    setStreaming,
    updateLastMessage,
    setContext,
    setEnrichedContext,
  } = useChatStore();

  const { user } = useAuthStore();

  // Load conversation from URL if conversationId is provided
  useEffect(() => {
    const loadConversationFromUrl = async () => {
      if (!conversationId || !user) return;

      try {
        const response = await authenticatedFetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const messages: Message[] = data.messages.map((m: IMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            contextUsed: m.contextUsed,
            contextGraph: m.contextGraph,
            enrichedContext: m.enrichedContext,
          }));

          // Find the last assistant message with enriched context
          const lastAssistantMessage = messages
            .filter(m => m.role === 'assistant')
            .reverse()
            .find(m => m.enrichedContext);

          // Load conversation into store
          useChatStore.setState({
            currentConversationId: conversationId,
            messages,
            context: lastAssistantMessage?.contextGraph || null,
            enrichedContext: lastAssistantMessage?.enrichedContext || null,
            currentStreamContent: '',
          });

          // Check for pending message to send
          const pendingMessage = localStorage.getItem('pendingMessage');
          if (pendingMessage) {
            localStorage.removeItem('pendingMessage');
            // Send the pending message
            setTimeout(() => handleSendMessage(pendingMessage), 100);
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
    };

    loadConversationFromUrl();
  }, [conversationId, user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleStreamData = useCallback((parsed: {
    content?: string;
    context?: GraphContext;
    enrichedContext?: EnrichedContext;
    conversationId?: string;
    done?: boolean;
  }) => {
    if (parsed.content) {
      bufferRef.current += parsed.content;
      updateLastMessage(bufferRef.current);
    }
    if (parsed.context) {
      setContext(parsed.context);
    }
    if (parsed.enrichedContext) {
      setEnrichedContext(parsed.enrichedContext);
    }
    if (parsed.done) {
      // Get the current state to access the latest context and enrichedContext
      const state = useChatStore.getState();
      const finalContext = state.context;
      const finalEnrichedContext = state.enrichedContext;
      const contextUsed = finalContext ? {
        documentCount: finalContext.nodes.filter((n) => n.type === 'Document').length,
        topicCount: finalContext.nodes.filter((n) => n.type === 'Topic').length,
        projectCount: finalContext.nodes.filter((n) => n.type === 'Project').length,
      } : undefined;
      updateLastMessage(bufferRef.current, finalContext || undefined, contextUsed, finalEnrichedContext || undefined);
    }
  }, [updateLastMessage, setContext, setEnrichedContext]);

  const processStreamChunk = useCallback((chunk: string) => {
    streamBufferRef.current += chunk;
    let buffer = streamBufferRef.current;

    while (true) {
      const endIndex = buffer.indexOf('\n\n');
      if (endIndex === -1) break;

      const line = buffer.slice(0, endIndex);
      buffer = buffer.slice(endIndex + 2);

      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        handleStreamData(parsed);
      } catch {
        // Ignore parse errors for streaming chunks
      }
    }

    streamBufferRef.current = buffer;
  }, [handleStreamData]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || isStreaming) return;

    // If no conversationId (on root page), create conversation first
    if (!conversationId) {
      try {
        const createResponse = await authenticatedFetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: content.slice(0, 50) + (content.length > 50 ? '...' : '') }),
        });

        if (!createResponse.ok) throw new Error('Failed to create conversation');

        const { id: newConversationId } = await createResponse.json();
        
        // Add user message to local state immediately
        const userMessage: Message = {
          id: nanoid(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        addMessage(userMessage);
        
        // Store the message to send after redirect
        localStorage.setItem('pendingMessage', content);
        
        // Redirect to the new conversation
        router.push(`/${newConversationId}`);
        return;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setStreaming(true);
    
    // Clear previous context when sending a new message
    setContext(null);
    setEnrichedContext(null);

    try {
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content,
          conversationId: conversationId || currentConversationId 
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      currentMessageIdRef.current = assistantMessage.id;
      addMessage(assistantMessage);

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        processStreamChunk(chunk);
      }
      
      // Refresh conversation list after message is complete
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refresh-conversations'));
      }, 500);
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage('Sorry, something went wrong. Please try again.');
    } finally {
      setStreaming(false);
      bufferRef.current = '';
      streamBufferRef.current = '';
    }
  }, [user, isStreaming, currentConversationId, addMessage, setStreaming, updateLastMessage, processStreamChunk, conversationId, router]);

  const isLastAssistantMessage = (index: number) => 
    isStreaming && index === messages.length - 1 && messages[index]?.role === 'assistant';

  const suggestions = [
    { text: 'What are my active projects?', icon: '🚀', gradient: 'from-blue-500 to-cyan-500' },
    { text: 'Summarize my recent notes', icon: '📝', gradient: 'from-emerald-500 to-teal-500' },
    { text: 'Explain my key concepts', icon: '💡', gradient: 'from-amber-500 to-orange-500' },
    { text: 'What should I learn next?', icon: '🎯', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 -left-1/4 h-96 w-96 bg-primary-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-1/4 -right-1/4 h-96 w-96 bg-accent-500 rounded-full blur-3xl"
        />
      </div>

      {/* Sidebar */}
      <ChatSidebar />
      
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col relative z-10">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-[70vh] flex-col items-center justify-center text-center"
              >
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-1/4 left-1/4 h-64 w-64 bg-primary-500/20 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-accent-500/20 rounded-full blur-3xl"
                  />
                </div>

                <div className="relative z-10 max-w-3xl px-4">
                  {/* Animated icon */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 20,
                      delay: 0.2
                    }}
                    className="mb-8 relative inline-block"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-accent-500/30 blur-2xl rounded-full animate-pulse" />
                    <div className="relative glass rounded-3xl p-6 shadow-2xl border-2 border-primary-500/20">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <svg
                          className="h-16 w-16 text-primary-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Animated title */}
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-4 text-4xl font-bold bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                  >
                    Your Knowledge, Amplified
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-xl mx-auto text-base text-neutral-600 dark:text-neutral-300 leading-relaxed mb-10"
                  >
                    Ask questions about your documents, projects, and topics. I use your personal knowledge graph to provide intelligent, context-aware answers.
                  </motion.p>

                  {/* Animated suggestions */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={suggestion.text}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ 
                          scale: 1.05, 
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)" 
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendMessage(suggestion.text)}
                        className={`group relative px-5 py-4 text-left glass rounded-2xl transition-all-200 cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${suggestion.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <div className="relative flex items-center gap-3">
                          <span className="text-2xl">{suggestion.icon}</span>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-50 transition-colors">
                            {suggestion.text}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                  
                  {/* Additional info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-400"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Connected to knowledge graph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>Private & secure</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ChatMessage
                      message={
                        isLastAssistantMessage(index)
                          ? { ...message, content: currentStreamContent || message.content }
                          : message
                      }
                      isStreaming={isLastAssistantMessage(index)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* Typing indicator */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 py-4"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="h-2 w-2 bg-primary-500 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  AI is thinking...
                </span>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced input area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 border-t border-neutral-800/50 bg-gradient-to-t from-neutral-900/80 to-transparent backdrop-blur-xl"
        >
          <div className="mx-auto md:max-w-5xl max-w-full px-4">
            <ChatInput onSend={handleSendMessage} isLoading={isStreaming} disabled={!user} />
          </div>
        </motion.div>
      </div>

      {/* Context Panel */}
      {showContextPanel && <ContextPanel context={context} />}
    </div>
  );
}
