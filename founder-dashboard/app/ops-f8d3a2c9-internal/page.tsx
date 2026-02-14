'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from '@/components/LoginPage';
import DashboardLayout from '@/components/DashboardLayout';

export default function OpsInternalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for password session first (fastest path)
    const passwordAuth = sessionStorage.getItem('dashboard_auth');
    if (passwordAuth === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Set a timeout to stop loading after 2 seconds if Firebase is slow
    const timeout = setTimeout(() => {
      console.log('Auth timeout - showing login');
      setIsLoading(false);
    }, 2000);

    // Listen for Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'parikshit0120@gmail.com';
      console.log('Auth state changed:', user?.email);
      if (user && user.email === adminEmail) {
        setIsAuthenticated(true);
      } else if (user) {
        // Wrong email
        await auth.signOut();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-[#e8e6e3]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onPasswordSuccess={() => {
          sessionStorage.setItem('dashboard_auth', 'true');
          setIsAuthenticated(true);
        }}
        showPasswordLogin={showPasswordLogin}
        setShowPasswordLogin={setShowPasswordLogin}
      />
    );
  }

  return <DashboardLayout />;
}
