'use client';

import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  onPasswordSuccess: () => void;
  showPasswordLogin: boolean;
  setShowPasswordLogin: (show: boolean) => void;
}

export default function LoginPage({
  onPasswordSuccess,
  showPasswordLogin,
  setShowPasswordLogin,
}: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== 'parikshit0120@gmail.com') {
        await auth.signOut();
        setError('Unauthorized email address');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side password check for single-user dashboard
    // Protected by Firestore security rules (only your email can access data)
    if (password === 'goodwatch2026') {
      onPasswordSuccess();
    } else {
      setError('Invalid password');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    // Password reset handled by changing the hardcoded password above
    // This is a single-user dashboard, no email reset needed
    setError('Contact admin to reset password');
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="max-w-md w-full bg-[#1a1a1f] p-8 rounded-lg border border-[#2a2a2f]">
          <h2 className="text-2xl font-bold text-[#e8e6e3] mb-6">Reset Password</h2>

          {resetSent ? (
            <div className="bg-green-900/20 border border-green-700 p-4 rounded mb-4">
              <p className="text-green-400">
                Reset link sent to {resetEmail}. Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm text-[#a8a6a3] mb-2">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] focus:outline-none focus:border-[#d4a843]"
                  placeholder="hello@goodwatch.movie"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 p-3 rounded text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#d4a843] text-[#0a0a0f] py-2 px-4 rounded font-medium hover:bg-[#c49833] transition"
              >
                Send Reset Link
              </button>
            </form>
          )}

          <button
            onClick={() => {
              setShowResetForm(false);
              setResetSent(false);
              setError('');
            }}
            className="w-full mt-4 text-[#a8a6a3] text-sm hover:text-[#e8e6e3] transition"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="max-w-md w-full bg-[#1a1a1f] p-8 rounded-lg border border-[#2a2a2f]">
        <h1 className="text-3xl font-bold text-[#e8e6e3] mb-2">GoodWatch Ops</h1>
        <p className="text-[#a8a6a3] mb-8">Private founder dashboard</p>

        {!showPasswordLogin ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-900 py-3 px-4 rounded font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2a2f]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a1a1f] text-[#a8a6a3]">or</span>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordLogin(true)}
              className="w-full bg-[#2a2a2f] text-[#e8e6e3] py-3 px-4 rounded font-medium hover:bg-[#3a3a3f] transition"
            >
              Use Password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a8a6a3] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] focus:outline-none focus:border-[#d4a843]"
                  placeholder="Enter dashboard password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a6a3] hover:text-[#e8e6e3]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 p-3 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#d4a843] text-[#0a0a0f] py-2 px-4 rounded font-medium hover:bg-[#c49833] transition"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="w-full text-[#a8a6a3] text-sm hover:text-[#e8e6e3] transition"
            >
              Forgot password?
            </button>

            <button
              type="button"
              onClick={() => setShowPasswordLogin(false)}
              className="w-full text-[#a8a6a3] text-sm hover:text-[#e8e6e3] transition"
            >
              ← Back to Google login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
