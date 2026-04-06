import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComponentPropsWithoutRef } from "react";

interface DropdownMenuOption {
  label: string;
  onClick: () => void;
}

interface LoadingDropdownMenuProps extends ComponentPropsWithoutRef<typeof Button> {
  loading?: boolean;
  label: string;
  icon?: React.ReactNode;
  options: DropdownMenuOption[];
}

const LoadingDropdownMenu = ({
  loading = false,
  label,
  icon,
  options,
  ...buttonProps
}: LoadingDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} {...buttonProps} className={`gap-2 ${buttonProps.className ?? ""}`}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            icon
          )}
          {label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{ minWidth: "var(--radix-dropdown-menu-trigger-width)" }}
      >
        {options.map((option, index) => (
          <DropdownMenuItem key={index} onClick={option.onClick} className="gap-2">
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LoadingDropdownMenu;
