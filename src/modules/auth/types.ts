import { User, Session } from "@supabase/supabase-js";

export interface UserPermissions {
  views: string[];
  functionIds: number[];
  role: {
    roleIds: number[];
    roleNames: string[];
    isAdmin: boolean;
    capabilityIds: number[];
    capabilityNames: string[];
  } | null;
  permissionsLoading: boolean;
}

export const defaultPermissions: UserPermissions = {
  views: [],
  functionIds: [],
  role: null,
  permissionsLoading: true,
};

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissions: UserPermissions;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}
