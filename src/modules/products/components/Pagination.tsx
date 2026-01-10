import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function Pagination() {
  const startRecord = 1;
  const endRecord = 5;
  const totalRows = 50;

  return (
    <div className="flex flex-row items-center gap-2 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="px-3 py-1 bg-cyan-50/50 rounded-full">
        <span className="text-xs font-medium text-slate-600">
          {startRecord} - {endRecord} de {totalRows}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default Pagination;
