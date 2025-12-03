'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Download,
  Upload,
  Sparkles,
  Bot,
  Loader2
} from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import type { ConversationSummary } from '@/lib/stores/chat';

export function ChatSidebar() {
  const router = useRouter();
  const {
    sidebarOpen,
    toggleSidebar,
    conversations,
    currentConversationId,
    setConversations,
    isStreaming,
  } = useChatStore();
  const { user } = useAuthStore();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include', // Ensure cookies are sent with cross-origin requests
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations.sort((a: ConversationSummary, b: ConversationSummary) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [user, setConversations]);

  useEffect(() => {
    fetchConversations();
    
    // Listen for refresh events
    const handleRefresh = () => {
      fetchConversations();
    };
    
    window.addEventListener('refresh-conversations', handleRefresh);
    return () => window.removeEventListener('refresh-conversations', handleRefresh);
  }, [fetchConversations]);

  const handleSelectConversation = (id: string) => {
    router.push(`/${id}`);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Ensure cookies are sent with cross-origin requests
      });
      if (response.ok) {
        fetchConversations();
        if (currentConversationId === id) {
          router.push('/');
        }
      } else {
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/seed/templates', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent with cross-origin requests
      });
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge-base-template.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleUploadKnowledge = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies are sent with cross-origin requests
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Knowledge base uploaded successfully!');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to upload knowledge:', error);
      alert('Failed to parse JSON file');
    }

    e.target.value = '';
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full glass-card border-r border-neutral-200/30 dark:border-neutral-700/30 flex flex-col overflow-hidden md:relative absolute inset-y-0 left-0 z-50 md:z-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-200/30 dark:border-neutral-700/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="h-5 w-5 text-accent-500" />
                    {isStreaming && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm">
                    {isStreaming ? 'Thinking...' : 'Chats'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-0 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-all-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => {
                    useChatStore.setState({
                      messages: [],
                      currentConversationId: null,
                      context: null,
                      enrichedContext: null,
                    });
                    router.push('/');
                  }}
                  className="w-full gap-2 bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all-200 cursor-pointer"
                  disabled={isStreaming}
                >
                  {isStreaming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      New Chat
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="px-3 py-2 space-y-1">
                {conversations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center"
                  >
                    <Bot className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      No conversations yet
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      Start your first chat to see it here
                    </p>
                  </motion.div>
                ) : (
                  conversations.map((conv, index) => (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        'w-full px-3 py-3 rounded-lg text-left transition-all-200 group relative',
                        'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 hover:shadow-md',
                        'hover:scale-[1.01] active:scale-[0.99]',
                        currentConversationId === conv.id &&
                          'bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/50 shadow-md'
                      )}
                    >
                      {/* Active indicator */}
                      {currentConversationId === conv.id && (
                        <motion.div
                          layoutId="activeConversation"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-lg"
                        />
                      )}

                      <div className="flex items-start gap-2">
                        <div className="relative mt-0.5 shrink-0">
                          <MessageSquare className={cn(
                            'h-4 w-4 transition-colors',
                            currentConversationId === conv.id
                              ? 'text-primary-500'
                              : 'text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300'
                          )} />
                          {currentConversationId === conv.id && isStreaming && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className={cn(
                            'text-sm font-medium truncate transition-colors',
                            currentConversationId === conv.id
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-800 dark:group-hover:text-neutral-100'
                          )}>
                            {conv.title}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {conv.preview || 'No messages'}
                          </p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <motion.button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="absolute right-3 top-3 shrink-0 opacity-60 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all-200 hover:scale-110"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </motion.button>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer - Knowledge Base Actions */}
            <div className="p-4 border-t border-neutral-200/30 dark:border-neutral-700/30 space-y-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="w-full gap-2 text-xs transition-all-200 hover:shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Template
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadKnowledge}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs cursor-pointer transition-all-200 hover:shadow-md"
                    asChild
                  >
                    <span>
                      <Upload className="h-3.5 w-3.5" />
                      Upload Knowledge Base
                    </span>
                  </Button>
                </label>
              </motion.div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed Toggle */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="absolute left-4 top-20 z-10 p-3 glass rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all-200 shadow-lg hover:shadow-xl"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
            {isStreaming && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </motion.button>
      )}
    </>
  );
}