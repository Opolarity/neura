import { Search } from "lucide-react";

interface ReturnsFilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
}

const ReturnsFilterBar = ({
    search,
    onSearchChange,
}: ReturnsFilterBarProps) => {
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    type="text"
                    placeholder="Buscar por cliente o documento..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    );
};

export default ReturnsFilterBar;
