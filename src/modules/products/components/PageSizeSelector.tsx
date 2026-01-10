import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function PageSizeSelector() {
  const [value, setValue] = useState(20);
  const values = [20, 50, 100];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-16 h-9 flex flex-row items-center justify-between gap-1 border-gray-100 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all rounded-lg shadow-sm font-medium text-xs px-2.5"
        >
          {value}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {values.map((v) => (
          <DropdownMenuItem
            key={v}
            onSelect={() => {
              setValue(v);
              console.log("Opción seleccionada: " + v);
            }}
          >
            {v}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PageSizeSelector;
