import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Loader2, Trash } from "lucide-react"
import productPlaceholder from "@/assets/product-placeholder.png";
import { Category } from "../../types/Categories.types";

interface CategoriesTableProps {
    categories: Category[]
    loading: boolean
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
}

const CategoriesTable = ({ categories, loading, onEdit, onDelete }: CategoriesTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Padre</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && categories.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex justify-center items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando categorias...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : categories.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay categorias registradas.
                        </TableCell>
                    </TableRow>
                ) : categories.map((category) => (
                    <TableRow key={category.id}>
                        <TableCell className="font-mono text-muted-foreground">{category.id}</TableCell>
                        <TableCell>
                            <img
                                src={category.image || productPlaceholder}
                                alt={category.name}
                                className="w-16 h-16 object-cover rounded-md"
                            />
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>{category.parent_category}</TableCell>
                        <TableCell>{category.products}</TableCell>
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
                ))}
            </TableBody>
        </Table>
    )
}

export default CategoriesTable