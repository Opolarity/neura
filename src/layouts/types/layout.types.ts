export interface UserFunction {
    id: number;
    name: string;
    code: string | null;
    icon: string | null;
    location: string | null;
    parent_function: number | null;
    active: boolean;
    order: number | null;
}

export interface UserSession {
    user: {
        id: string;
        email: string;
    };
    role: string;
    functions: UserFunction[];
    views: string[];
}

export interface GetUserFunctionsResponse {
    success: boolean;
    session: UserSession;
    error?: string;
}

// Types for sp_get_user_views response
export interface SpUserRole {
    role_id: number[];
    role_name: string[];
    admin: boolean;
    capability_id: number[] | null;
    capability_name: string[] | null;
}

export interface SpUserFunction {
    id: number;
    name: string;
    menu: boolean;
}

export interface SpGetUserViewsResponse {
    user_id: string;
    role: SpUserRole;
    functions: SpUserFunction[];
    views: (string | null)[];
}
