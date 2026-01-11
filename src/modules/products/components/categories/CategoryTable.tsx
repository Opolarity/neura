import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash } from "lucide-react";
import { Category } from "../../products.types";
import productPlaceholder from "@/assets/product-placeholder.png";

interface CategoryTableProps {
    categories: Category[];
    loading: boolean;
    productCounts: Record<number, number>;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const CategoryTable = ({ categories, loading, productCounts, onEdit, onDelete }: CategoryTableProps) => {
    // Create a map for quick parent name lookup
    const categoryMap = React.useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<number, string>);
    }, [categories]);

    return (
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
                    categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>
                                <img
                                    src={category.image_url || productPlaceholder}
                                    alt={category.name}
                                    className="w-16 h-16 object-cover rounded-md"
                                />
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>
                                {category.parent_id ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                        {categoryMap[category.parent_id] || 'Desconocido'}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                            <TableCell>{productCounts[category.id] || 0}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(category)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDelete(category)}
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
    );
};

export default CategoryTable;
