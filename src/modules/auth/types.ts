import { User, Session } from "@supabase/supabase-js";

export interface AppUser {
  accountName: string;
  roleName: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** permissions.code con type = 'route'. Gobierna el sidebar y ProtectedRoute. */
  permissionCodes: string[];
  /** permissions.code con type = 'component': acciones dentro de una vista. */
  capabilityCodes: string[];
  permissionsLoading: boolean;
  appUser: AppUser | null;
  appUserLoading: boolean;
  companyShortName: string;
  companyShortNameLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}
