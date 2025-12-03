'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Network, LogOut, PanelRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { useChatStore } from '@/lib/stores/chat';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showContextPanel, toggleContextPanel, clearMessages } = useChatStore();

  // Enforce dark mode only
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      clearMessages();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <TooltipProvider>
      <header className="flex h-14 items-center justify-between glass-card border-b border-neutral-200/30 dark:border-neutral-700/30 px-4 transition-theme">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/30 blur-lg rounded-xl" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-accent-500 shadow-lg">
              <Network className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                Context AI
              </h1>
              <Sparkles className="h-3.5 w-3.5 text-accent-500" />
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Knowledge-aware assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showContextPanel ? 'secondary' : 'ghost'}
                size="sm"
                onClick={toggleContextPanel}
                className="h-8 w-8 p-0 transition-all"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle context panel</TooltipContent>
          </Tooltip>

          {user && (
            <>
              <div className="mx-2 h-5 w-px bg-neutral-200/50 dark:bg-neutral-700/50" />

              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 ring-2 ring-primary-500/20">
                  <AvatarFallback className="bg-linear-to-br from-primary-500 to-accent-500 text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-neutral-700 dark:text-neutral-200 md:block">
                  {user.name}
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
