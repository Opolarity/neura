import { User, Session } from "@supabase/supabase-js";
import { UserFunction } from "@/layouts/types/layout.types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export interface MenuFunction extends UserFunction {
  subItems?: {
    label: string;
    items: UserFunction[];
  }[];
}

export interface FunctionsContextType {
  functions: MenuFunction[];
  allowedRoutes: string[];
  loading: boolean;
  error: string | null;
}
