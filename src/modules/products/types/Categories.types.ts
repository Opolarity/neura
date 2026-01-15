export interface CategoryApiResponse {
    data: Array<{
        image_url: string | null;
        name: string;
        products: number;
        description: string | null;
        id_category: number;
        parent_category_name: string | null;
        id_parent: number | null
    }>,
    page: {
        page: number;
        size: number;
        total: number;
    }
}

export interface Category {
    id: number;
    image: string | null;
    name: string;
    products: number;
    description: string | null;
    parent_category: string | null;
    parent_id: number | null
}

export interface SimpleCategory {
    id: number;
    name: string;
}

export type CategoryPayload = {
    id?: number,
    name: string,
    parent_category: number | null
    description: string | null,
    image_url: string | null
};

export interface CategoryFilters {
    page?: number | null;
    size?: number | null;
    search?: string | null;
    description?: boolean | null;
    parentcategory?: boolean | null;
    minproducts?: number | null;
    maxproducts?: number | null;
    order?: string | null;
    image?: boolean | null;
}
