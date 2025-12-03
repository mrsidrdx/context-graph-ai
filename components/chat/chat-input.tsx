'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  readonly onSend: (message: string) => void;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;

    onSend(trimmed);
    setMessage('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const characterCount = message.length;
  const maxCharacters = 4000;

  return (
    <div className="relative">
      {/* Animated background glow */}
      {isFocused && (
        <motion.div
          layoutId="inputGlow"
          className="absolute inset-0 bg-primary-500/5 blur-xl rounded-3xl -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <div className="relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={cn(
              'flex items-end gap-3 rounded-2xl border-2 glass p-3 transition-all-200',
              isFocused
                ? 'border-primary-400/50 shadow-lg shadow-primary-500/10'
                : 'border-neutral-200/50 dark:border-neutral-700/50',
              'hover:border-neutral-300/50 dark:hover:border-neutral-600/50'
            )}
          >
            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  isLoading
                    ? "AI is thinking..."
                    : "Ask me anything about your knowledge base..."
                }
                disabled={isLoading || disabled}
                rows={1}
                className={cn(
                  'max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-0 py-2.5 text-base outline-none transition-all-200',
                  'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'leading-relaxed',
                  message.length > 0 && 'text-neutral-800 dark:text-neutral-100'
                )}
              />

              {/* Character count indicator */}
              {message.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-1 right-1 text-[10px] text-neutral-400"
                >
                  {characterCount}/{maxCharacters}
                </motion.div>
              )}
            </div>

            {/* Send button */}
            <motion.div
              whileHover={{ scale: message.trim() && !isLoading ? 1.05 : 1 }}
              whileTap={{ scale: message.trim() && !isLoading ? 0.95 : 1 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || isLoading || disabled}
                size="icon"
                className={cn(
                  'h-10 w-10 shrink-0 transition-all-200',
                  message.trim() && !isLoading &&
                    'bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg'
                )}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                ) : message.trim() ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Sparkles className="h-4 w-4 text-neutral-400" />
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Character count helper */}
        {characterCount > maxCharacters * 0.8 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-end px-2"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'text-xs',
                characterCount > maxCharacters
                  ? 'text-red-500'
                  : 'text-amber-500'
              )}
            >
              {characterCount > maxCharacters ? 'Too long!' : 'Getting long...'}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}