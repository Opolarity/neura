export interface TypesApiResponse {
    types: Array<{
        id: number;
        name: string;
        code: string;
    }>;
}
export interface Types {
    id: number;
    name: string;
    code: string;
}