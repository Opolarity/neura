import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Types } from "@/shared/types/type";

interface CMovementSelectProductTypesProps {
    productStatusTypes: Types[];
    productStatusType: number;
    onTypeStock: (typeStock: Types | null) => void;
}

const CMovementSelectProductTypes = ({
    productStatusTypes,
    productStatusType,
    onTypeStock,
}: CMovementSelectProductTypesProps) => {

    const handleTypeInventory = (v: string) => {
        const findMovementType = productStatusTypes.find((t) => t.id.toString() === v);
        if (onTypeStock && findMovementType) {
            onTypeStock(findMovementType);
        }
    };

    return (
        <Select
            value={productStatusType?.toString() || ""}
            onValueChange={(v) => handleTypeInventory(v)}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de inventario" />
            </SelectTrigger>
            <SelectContent>
                {productStatusTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export default CMovementSelectProductTypes