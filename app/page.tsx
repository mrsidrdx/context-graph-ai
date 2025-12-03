'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { authenticatedFetch } from '@/lib/auth/token';
import { Header } from '@/components/layout/header';
import { ChatContainer } from '@/components/chat/chat-container';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
}
