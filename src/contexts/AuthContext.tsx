import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use ref to track if initial session has been set by the listener
    // This persists across async operations reliably
    let initialSessionSet = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initialSessionSet = true;
      }
    );

    // THEN check for existing session as fallback
    // Only update state if the listener hasn't already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialSessionSet) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Failed to get initial session:', error);
      if (!initialSessionSet) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (error) {
        console.error('Sign up failed:', error.message);
      }

      return { error: error as Error | null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred during sign up');
      console.error('Unexpected sign up error:', error);
      return { error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in failed:', error.message);
      }

      return { error: error as Error | null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred during sign in');
      console.error('Unexpected sign in error:', error);
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out failed:', error.message);
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
