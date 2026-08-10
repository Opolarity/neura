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

/**
 * Fila cruda de la tabla `tags`. Etiquetas y marcas comparten tabla y se
 * distinguen por `type` ('tag' | 'brand'); los consumidores filtran por
 * ese campo. Se usa en filtros y modales de asignación masiva.
 */
export interface TagsResponse {
    id: number;
    name: string;
    code: string;
    type: string;
}
