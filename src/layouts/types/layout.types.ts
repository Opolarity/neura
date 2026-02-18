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
}

export interface GetUserFunctionsResponse {
    success: boolean;
    session: UserSession;
    error?: string;
}
