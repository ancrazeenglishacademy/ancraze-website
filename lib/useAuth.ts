'use client';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

interface AuthUser extends User {
  fullName?: string;
  role?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser as AuthUser | null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      setError(null);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        return data.user;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send to backend to create/update user in Firestore
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google sign-in failed');
      }

      return data.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        // Send email and password to server API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        return data.user;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  return {
    user,
    loading,
    error,
    registerWithEmail,
    loginWithEmail,
    signInWithGoogle,
    logout,
  };
};
