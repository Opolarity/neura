import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";

interface InventoryFilterBarProps {
    search: string;
    onSearchChange: (text: string) => void;
    onOpen: () => void;
    order?: string | null;
    onOrderChange: (value: string) => void;
}

export default function InventoryFilterBar({
    search,
    order,
    onSearchChange,
    onOpen,
    onOrderChange,
}: InventoryFilterBarProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    type="text"
                    placeholder="Buscar productos..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <Button onClick={onOpen} className="gap-2">
                <ListFilter className="w-4 h-4" />
                Filtrar
            </Button>

            <Select
                value={order || "none"}
                onValueChange={(value) =>
                    onOrderChange(value === "none" ? "none" : value)
                }
            >
                <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Sin orden</SelectItem>
                    <SelectItem value="alp-asc">Nombre (A-Z)</SelectItem>
                    <SelectItem value="alp-dsc">Nombre (Z-A)</SelectItem>
                    <SelectItem value="stc-asc">Menor stock</SelectItem>
                    <SelectItem value="stc-dsc">Mayor stock</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}