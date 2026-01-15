import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CategoriesHeaderProps {
    onOpen: () => void;
}

const CategoriesHeader = ({ onOpen }: CategoriesHeaderProps) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Listado de categorías
                </h1>
                <p className="text-gray-600">Administra tu catálogo de categorías</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => onOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir categoría
                </Button>
            </div>
        </div>
    )
}

export default CategoriesHeader