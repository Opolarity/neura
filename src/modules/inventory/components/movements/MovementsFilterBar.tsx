import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";

interface MovementsFilterBarProps {
    search: string;
    onSearchChange: (text: string) => void;
    onOpen: () => void;
}

const MovementsFilterBar = ({
    search,
    onSearchChange,
    onOpen
}: MovementsFilterBarProps) => {
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    type="text"
                    placeholder="Buscar movimientos..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <Button onClick={onOpen} className="gap-2">
                <ListFilter className="w-4 h-4" />
                Filtrar
            </Button>
        </div>
    )
}

export default MovementsFilterBar