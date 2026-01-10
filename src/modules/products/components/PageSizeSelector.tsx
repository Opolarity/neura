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
          className="w-20 h-10 flex flex-row items-center gap-1"
        >
          {value}
          <ChevronDown className="w-4 h-4" />
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
