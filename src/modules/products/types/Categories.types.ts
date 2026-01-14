export interface CategoryApiResponse {
    data: Array<{
        imagen: string | null;
        nombre: string;
        productos: number;
        descripcion: string | null;
        id_category: number;
        categoria_padre: number | null
    }>,
    page: {
        page: number;
        size: number;
        total: number;
    }
}

export interface Category {
    imagen: string | null;
    nombre: string;
    productos: number;
    descripcion: string | null;
    id_category: number;
    categoria_padre: number | null
}