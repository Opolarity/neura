import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilter, Search } from "lucide-react";

interface BrandsFilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
}

export default function BrandsFilterBar({ search, onSearchChange }: BrandsFilterBarProps) {
    const [inputValue, setInputValue] = useState(search);

    useEffect(() => {
        setInputValue(search);
    }, [search]);

    const handleSearch = () => {
        onSearchChange(inputValue);
    };

    return (
        <div className="flex items-center gap-2 p-6">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Buscar marcas..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button variant="outline" onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                </Button>
            </div>

            {/* <Button variant="outline" className="gap-2">
                <ListFilter className="w-4 h-4" />
                Filtrar
            </Button>

            <Select>
                <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Sin orden</SelectItem>
                    <SelectItem value="prd-asc">Menos productos</SelectItem>
                    <SelectItem value="prd-dsc">Más productos</SelectItem>
                </SelectContent>
            </Select> */}
        </div>
    );
}
