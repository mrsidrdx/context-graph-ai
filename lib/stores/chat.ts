'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, GraphContext, EnrichedContext } from '@/lib/types';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamContent: string;
  context: GraphContext | null;
  enrichedContext: EnrichedContext | null;
  showContextPanel: boolean;
  currentConversationId: string | null;
  conversations: ConversationSummary[];
  sidebarOpen: boolean;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, contextGraph?: GraphContext) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamContent: (content: string) => void;
  appendStreamContent: (content: string) => void;
  setContext: (context: GraphContext) => void;
  setEnrichedContext: (enriched: EnrichedContext | null) => void;
  toggleContextPanel: () => void;
  toggleSidebar: () => void;
  clearMessages: () => void;
  setCurrentConversation: (id: string | null) => void;
  setConversations: (conversations: ConversationSummary[]) => void;
  loadConversation: (id: string, messages: Message[]) => void;
  startNewConversation: () => void;
  refreshConversations: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,
      currentStreamContent: '',
      context: null,
      enrichedContext: null,
      showContextPanel: false,
      currentConversationId: null,
      conversations: [],
      sidebarOpen: true,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content, contextGraph) =>
        set((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages.at(-1)!,
              content,
              streaming: false,
              contextGraph,
            };
          }
          return { messages };
        }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setStreamContent: (content) => set({ currentStreamContent: content }),
      appendStreamContent: (content) =>
        set((state) => ({
          currentStreamContent: state.currentStreamContent + content,
        })),
      setContext: (context) => set({ context }),
      setEnrichedContext: (enriched) => set({ enrichedContext: enriched }),
      toggleContextPanel: () =>
        set((state) => ({ showContextPanel: !state.showContextPanel })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      clearMessages: () => set({ messages: [], context: null, enrichedContext: null }),
      setCurrentConversation: (id) => set({ currentConversationId: id }),
      setConversations: (conversations) => set({ conversations }),
      loadConversation: (id, messages) => set({ 
        currentConversationId: id, 
        messages,
        context: null,
        enrichedContext: null,
      }),
      startNewConversation: () => set({
        currentConversationId: null,
        messages: [],
        context: null,
        enrichedContext: null,
        currentStreamContent: '',
      }),
      refreshConversations: () => {
        // This will be called externally to trigger conversation list refresh
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        showContextPanel: state.showContextPanel,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
