import { User, Session } from "@supabase/supabase-js";

export interface AppUser {
  accountName: string;
  roleName: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissionCodes: string[];
  /** `isAdmin` de sp_get_user_permissions: el rol ve todo sin mirar los codes. */
  isAdmin: boolean;
  permissionsLoading: boolean;
  appUser: AppUser | null;
  appUserLoading: boolean;
  companyShortName: string;
  companyShortNameLoading: boolean;
  /** Cierre de sesión en vuelo: ProtectedLayout tapa con el splash mientras dura. */
  signingOut: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}
