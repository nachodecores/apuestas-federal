"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserContextType, UserProfile } from "@/types";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [federalBalance, setFederalBalance] = useState<number>(0);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setFederalBalance(0);
      setRealBalance(null);
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, team_logo, fpl_entry_id, federal_balance, real_balance, role_id")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data as UserProfile);
      setFederalBalance(data.federal_balance ?? 0);
      setRealBalance(data.real_balance ?? null);
      setIsAdmin((data.role_id ?? 1) === 2);
    }
  }, [supabase, user]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const authPromise = supabase.auth.getUser();
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("auth-timeout")), 5000));
        const { data } = (await Promise.race([authPromise, timeout])) as any;
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadProfile();
      setLoading(false);
    })();
  }, [loadProfile]);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        federalBalance,
        realBalance,
        isAdmin,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
}




