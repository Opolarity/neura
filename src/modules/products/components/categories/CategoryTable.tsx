import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash, Search, Filter } from "lucide-react";
import { Category } from "../../products.types";
import productPlaceholder from "@/assets/product-placeholder.png";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CategoryTableProps {
    categories: any[];
    loading: boolean;
    search: string;
    onSearchChange: (search: string) => void;
    pagination: {
        total: number;
        page: number;
        pageSize: number;
    };
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const CategoryTable = ({
    categories,
    loading,
    search,
    onSearchChange,
    pagination,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete
}: CategoryTableProps) => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-t-lg border-b">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Buscar categorías..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imagen</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Padre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Cargando categorias...
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay categorias registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category, index) => (
                                <TableRow key={category.name + index}>
                                    <TableCell>
                                        <img
                                            src={category.image_url || productPlaceholder}
                                            alt={category.name}
                                            className="w-16 h-16 object-cover rounded-md"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>
                                        {category.parent_name ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                {category.parent_name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${category.product_count > 0 ? 'text-primary' : 'text-slate-400'}`}>
                                            {category.product_count}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit({
                                                    id: 0, // we don't have ID from this endpoint yet, but need it for compatibility
                                                    name: category.name,
                                                    description: category.description,
                                                    image_url: category.image_url,
                                                    parent_id: null // same here
                                                } as Category)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => onDelete({
                                                    id: 0,
                                                    name: category.name
                                                } as Category)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Filas por página</span>
                        <Select
                            value={String(pagination.pageSize)}
                            onValueChange={(value) => onPageSizeChange(Number(value))}
                        >
                            <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Pagination className="w-auto mx-0">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                                className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-sm font-medium px-4">
                                Página {pagination.page} de {totalPages || 1}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
                                className={pagination.page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};

export default CategoryTable;
