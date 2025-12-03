'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Loader2, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/lib/stores/auth';
import { authToken } from '@/lib/auth/token';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      authToken.set(data.token);
      setUser(data.user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black px-4 py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 h-96 w-96 bg-primary-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-accent-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl shadow-primary-500/30"
          >
            <Network className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-white via-neutral-100 to-neutral-200 bg-clip-text text-transparent"
          >
            Welcome back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-neutral-400"
          >
            Sign in to your account and continue exploring
          </motion.p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-neutral-800/50 bg-neutral-900/50 backdrop-blur-xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="mb-3 block text-sm font-semibold text-neutral-200"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-neutral-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-12 pl-12 bg-neutral-800/50 border-neutral-700/50 text-white placeholder:text-neutral-500 focus:border-primary-500/50 focus:bg-neutral-800 transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="mb-3 block text-sm font-semibold text-neutral-200"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-neutral-500 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 pl-12 bg-neutral-800/50 border-neutral-700/50 text-white placeholder:text-neutral-500 focus:border-primary-500/50 focus:bg-neutral-800 transition-all"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300 flex items-start gap-3"
              >
                <div className="mt-0.5 h-2 w-2 bg-red-500 rounded-full flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Sign in button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="h-12 w-full mt-6 rounded-full bg-white text-neutral-900 font-semibold shadow-lg shadow-neutral-300/20 hover:shadow-xl hover:shadow-neutral-300/30 hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-700/50" />
            <span className="text-xs text-neutral-500">OR</span>
            <div className="flex-1 h-px bg-neutral-700/50" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-white bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent hover:from-primary-300 hover:to-accent-300 transition-all"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
