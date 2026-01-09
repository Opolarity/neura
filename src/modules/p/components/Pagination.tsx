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
    <div className="flex flex-row items-center gap-1">
      <Button variant="ghost" className="w-10 h-10 rounded-full cursor-pointer">
        <ChevronsLeft className="w-4 h-4" />
      </Button>
      <Button variant="ghost" className="w-10 h-10 rounded-full cursor-pointer">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {startRecord} a {endRecord} de {totalRows}
      <Button variant="ghost" className="w-10 h-10 rounded-full cursor-pointer">
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button variant="ghost" className="w-10 h-10 rounded-full cursor-pointer">
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default Pagination;
