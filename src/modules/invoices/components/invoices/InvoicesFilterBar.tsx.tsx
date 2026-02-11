import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";
import InvoicesFilterModal from "./InvoicesFilterModal";

const InvoicesFilterBar = () => {
  const invoices = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar roles..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <InvoicesFilterModal />
      </div>
    </div>
  );
};

export default InvoicesFilterBar;
