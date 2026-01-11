import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '../Supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string | null; name?: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    profession?: string;
    hospital?: string;
    phone?: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string | null; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? null, name: (u as any)?.user_metadata?.name });
        // Fire-and-forget profile name fetch
        loadProfileName(u.id);
      }
      setLoading(false);
    });
    // Subscribe to auth state changes
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? null, name: (u as any)?.user_metadata?.name });
        // Fire-and-forget profile name fetch
        loadProfileName(u.id);
      } else {
        setUser(null);
      }
    });
    return () => authSub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = data.user;
    if (u) {
      setUser({ id: u.id, email: u.email ?? null, name: (u as any)?.user_metadata?.name });
      // Fire-and-forget profile name fetch to avoid blocking UI
      loadProfileName(u.id);
    }
  };

  const signup = async ({ name, email, password, profession, hospital, phone }: {
    name: string; email: string; password: string; profession?: string; hospital?: string; phone?: string;
  }) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, profession, hospital, phone },
      },
    });
    if (error) throw error;
    const u = data.user;
    if (u) {
      setUser({ id: u.id, email: u.email ?? null, name });
      // Create profile record
      await supabase.from('profiles').upsert({
        id: u.id,
        full_name: name,
        profession,
        hospital_name: hospital,
        phone_number: phone,
      }, { onConflict: 'id' });
    }
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = useMemo(() => ({ isAuthenticated, user, loading, login, signup, requestPasswordReset, logout }), [isAuthenticated, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
