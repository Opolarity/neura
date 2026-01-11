import { Search, UserPlus, Tag, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PosHeaderProps {
    search: string;
    onSearchChange: (val: string) => void;
    onOpenCustomerSelector: () => void;
    selectedCustomer: any;
}

export const PosHeader = ({ search, onSearchChange, onOpenCustomerSelector, selectedCustomer }: PosHeaderProps) => {
    const customerName = selectedCustomer
        ? `${selectedCustomer.name} ${selectedCustomer.last_name}`.trim()
        : "Select Customer";

    return (
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 py-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                    placeholder="Search by SKU, name or barcode..."
                    className="pl-10 h-11 bg-white border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <Button
                variant={selectedCustomer ? "default" : "outline"}
                onClick={onOpenCustomerSelector}
                className={`h-11 px-4 gap-2 rounded-xl transition-all shadow-sm ${selectedCustomer
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                        : "border-slate-200 hover:border-blue-500 hover:text-blue-600 bg-white"
                    }`}
            >
                {selectedCustomer ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span className="hidden sm:inline font-semibold">{customerName}</span>
            </Button>

            <Button variant="outline" className="h-11 px-4 gap-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl bg-white shadow-sm transition-all">
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Quick Discount</span>
            </Button>
        </div>
    );
};
