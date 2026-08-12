import { User, Session } from "@supabase/supabase-js";

export interface AppUser {
  accountName: string;
  roleName: string;
  branchName: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissionCodes: string[];
  permissionsLoading: boolean;
  appUser: AppUser | null;
  appUserLoading: boolean;
  companyShortName: string;
  companyShortNameLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}
