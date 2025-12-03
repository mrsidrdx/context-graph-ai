'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Sparkles, Copy, Check, Network } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from './markdown-renderer';
import { useChatStore } from '@/lib/stores/chat';
import type { Message } from '@/lib/types';

interface MessageProps {
  readonly message: Message;
  readonly isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const { setContext, toggleContextPanel, showContextPanel } = useChatStore();
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setShowCopyToast(true);
      
      // Reset states after animation
      setTimeout(() => {
        setCopied(false);
        setShowCopyToast(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };
  
  const handleViewContext = () => {
    if (message.contextGraph) {
      setContext(message.contextGraph);
      if (!showContextPanel) {
        toggleContextPanel();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex gap-4 px-4 py-6',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar with enhanced animations */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: isUser ? 5 : -5 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'relative h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-all-200',
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30'
            : 'bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg shadow-accent-500/30'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}

        {/* Enhanced streaming indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-3 w-3"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing indicator dots for bot */}
        {!isUser && isStreaming && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
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
                className="h-1 w-1 bg-white rounded-full"
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Message content with enhanced styling */}
      <div className="flex-1 flex flex-col">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            'relative max-w-[90%] rounded-2xl px-5 py-4 transition-all-300',
            isUser
              ? 'ml-auto rounded-tr-sm bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/20 hover:shadow-2xl'
              : 'glass-card rounded-tl-sm hover:shadow-lg'
          )}
        >
          {/* Copy button */}
          <AnimatePresence>
            {showActions && !isUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-2 right-2 flex gap-1"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className={cn(
                    "relative p-1.5 rounded-lg transition-all-200",
                    copied 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                      : "bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 text-neutral-500 dark:text-neutral-400"
                  )}
                  title="Copy message"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Copy success toast */}
          <AnimatePresence>
            {showCopyToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-2 z-10"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-medium shadow-lg">
                  <Check className="h-3 w-3" />
                  <span>Copied to clipboard!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message text */}
          <div className="relative">
            {isUser ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap pr-8">
                {message.content}
              </div>
            ) : (
              <div className="text-sm text-neutral-800 dark:text-neutral-100 pr-8">
                <MarkdownRenderer content={message.content} />

                {/* Enhanced streaming cursor */}
                {isStreaming && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block ml-1 h-4 w-0.5 bg-accent-500"
                  />
                )}
              </div>
            )}
          </div>

          {/* Enhanced context usage indicator */}
          <AnimatePresence>
            {message.contextUsed && !isUser && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center justify-between border-t border-neutral-200/50 pt-3 text-xs dark:border-neutral-700/50"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                  </motion.div>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                    Context-aware response
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    • {message.contextUsed.documentCount} docs, {message.contextUsed.topicCount} topics
                    {message.contextUsed.projectCount > 0 && `, ${message.contextUsed.projectCount} projects`}
                  </span>
                </div>
                {message.contextGraph && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleViewContext}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 transition-colors"
                    title="View context graph"
                  >
                    <Network className="h-3 w-3" />
                    <span className="text-[10px] font-medium">View</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'mt-2 text-xs text-neutral-400 dark:text-neutral-500',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}