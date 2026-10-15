import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface CategoriesHeaderProps {
    onOpen: () => void;
}

const CategoriesHeader = ({ onOpen }: CategoriesHeaderProps) => {
    return (
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
                Listado de categorías
            </h1>
            <div className="flex gap-2">
                <ComponentPermission codeIn={["product_categories.create"]}>
                    <Button onClick={() => onOpen()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir categoría
                    </Button>
                </ComponentPermission>
            </div>
        </div>
    )
}

export default CategoriesHeader
