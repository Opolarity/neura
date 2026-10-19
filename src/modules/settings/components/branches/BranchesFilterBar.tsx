import { Search } from "lucide-react";
import { ListFilter } from "lucide-react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface BranchesFilterBarProps {
    search: string;
    onSearchChange: (text: string) => void;
    onOpen?: () => void;
    hasActiveFilters?: boolean;
}

const BranchesFilterBar = ({
    search,
    onSearchChange,
    onOpen,
    hasActiveFilters
}: BranchesFilterBarProps) => {
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    type="text"
                    placeholder="Buscar sucursales..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            {onOpen && (
                <TooltipIconButton onClick={onOpen} variant={hasActiveFilters ? "default" : "outline"} icon={<ListFilter className="w-4 h-4" />} label="Filtrar" />
            )}
        </div>
    )
}

export default BranchesFilterBar
