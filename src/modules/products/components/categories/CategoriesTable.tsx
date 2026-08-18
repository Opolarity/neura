import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Loader2, Trash } from "lucide-react"
import productPlaceholder from "@/assets/product-placeholder.png";
import { ComponentPermission } from "@/shared/components/component-permission";
import { Category } from "../../types/Categories.types";

interface CategoriesTableProps {
    categories: Category[]
    loading: boolean
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
}

// Codes de la columna Acciones. En una constante para que la cabecera y las
// celdas no puedan quedar con listas distintas y aparezca un th sin td.
const ACTION_CODES = ["product_categories.edit", "product_categories.delete"];

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
                    {/* Se envuelve la celda entera, no su contenido: un th/td
                        vacío sigue ocupando ancho. Basta con tener UNA de las
                        dos acciones para que la columna tenga sentido. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead>Acciones</TableHead>
                    </ComponentPermission>
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
                        <TableCell>
                            {category.description ? (
                                <div
                                    className="prose prose-sm max-w-none line-clamp-2 [&_p]:m-0"
                                    dangerouslySetInnerHTML={{ __html: category.description }}
                                />
                            ) : (
                                '-'
                            )}
                        </TableCell>
                        <TableCell>{category.parent_category}</TableCell>
                        <TableCell>{category.products}</TableCell>
                        <ComponentPermission codeIn={ACTION_CODES}>
                            <TableCell>
                                <div className="flex gap-2">
                                    <ComponentPermission codeIn={["product_categories.edit"]}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(category)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </ComponentPermission>
                                    <ComponentPermission codeIn={["product_categories.delete"]}>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDelete(category)}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </ComponentPermission>
                                </div>
                            </TableCell>
                        </ComponentPermission>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default CategoriesTable