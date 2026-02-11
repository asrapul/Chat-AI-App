import supabase from '@/lib/supabase';
import { getOnboardingCompleted, setOnboardingCompleted } from '@/utils/storage';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isOnboardingCompleted: false,
  completeOnboarding: async () => {},
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Get initial session and onboarding status
    Promise.all([
      supabase.auth.getSession(),
      getOnboardingCompleted()
    ]).then(([{ data: { session } }, completed]) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsOnboardingCompleted(completed);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || email.split('@')[0] },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const completeOnboarding = async () => {
    await setOnboardingCompleted(true);
    setIsOnboardingCompleted(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isOnboardingCompleted, completeOnboarding, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
