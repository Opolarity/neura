import { supabase } from "@/integrations/supabase/client";

export const authService = {
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return supabase.auth.signOut();
  },
  
  getSession: async () => {
    return supabase.auth.getSession();
  },
  
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
