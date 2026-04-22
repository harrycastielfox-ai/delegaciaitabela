import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'delegado' | 'escrivao' | 'investigador' | 'admin';
export type UserStatus = 'pending' | 'active' | 'blocked';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar profile:', error);
      setProfile(null);
      return;
    }

    setProfile((data as UserProfile | null) ?? null);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar profile:', error);
      setProfile(null);
      return;
    }

    setProfile((data as UserProfile | null) ?? null);
  };

  useEffect(() => {
const syncAuthState = (session: Session | null) => {
  setSession(session);
  setUser(session?.user ?? null);
};

const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  syncAuthState(session);
});

supabase.auth.getSession()
  .then(({ data: { session } }) => {
    syncAuthState(session);
  })
  .catch((error) => {
    console.error('Erro ao recuperar sessão:', error);
    setUser(null);
    setProfile(null);
  })
  .finally(() => {
    setLoading(false);
  });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        syncAuthState(session);
      })
      .catch((error) => {
        console.error('Erro ao recuperar sessão:', error);
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    loadProfile(user.id)
      .catch((error) => {
        console.error('Erro ao sincronizar profile:', error);
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
<AuthContext.Provider value={{ user, session, profile, loading, profileLoading, signIn, signUp, signOut }}>
  {children}
</AuthContext.Provider>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
