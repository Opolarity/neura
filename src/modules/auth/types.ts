import { User, Session } from "@supabase/supabase-js";

export interface AppUser {
  accountName: string;
  roleName: string;
}

/**
 * Plan contratado (`plan` de sp_get_user_permissions). Es lo que recorta el
 * menú y el catálogo de permisos del lado del backend; aquí solo se muestra.
 * `code` null = sin plan configurado (parameters.SubscriptionCode; el backend
 * concede todo).
 */
export interface TenantSubscription {
  code: string | null;
  name: string | null;
  number: number | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissionCodes: string[];
  /**
   * `isAdmin` de sp_get_user_permissions. Desde el recorte por plan el admin ya
   * NO ve todo: recibe el catálogo de su plan, así que los codes se evalúan
   * igual que para cualquier otro rol.
   */
  isAdmin: boolean;
  /** Plan contratado. Null hasta que llegue la RPC. */
  subscription: TenantSubscription | null;
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
