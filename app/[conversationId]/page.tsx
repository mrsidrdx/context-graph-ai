'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { authenticatedFetch } from '@/lib/auth/token';
import { Header } from '@/components/layout/header';
import { ChatContainer } from '@/components/chat/chat-container';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
  const [conversationExists, setConversationExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authenticatedFetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
          router.push('/login');
        }
      } catch {
        setUser(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, setUser, setLoading]);

  // Check if conversation exists
  useEffect(() => {
    const checkConversation = async () => {
      if (!user || !conversationId) return;

      try {
        const response = await authenticatedFetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          setConversationExists(true);
        } else if (response.status === 404) {
          setConversationExists(false);
          // Redirect to home if conversation doesn't exist
          router.push('/');
        } else {
          setConversationExists(false);
        }
      } catch (error) {
        console.error('Failed to check conversation:', error);
        setConversationExists(false);
      }
    };

    checkConversation();
  }, [user, conversationId, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (conversationExists === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
          <p className="text-neutral-500">Conversation not found...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-neutral-900">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatContainer conversationId={conversationId} />
      </main>
    </div>
  );
}