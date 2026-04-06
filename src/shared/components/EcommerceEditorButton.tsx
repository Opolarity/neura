import React from "react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComponentPropsWithoutRef } from "react";
import { useEcommerceSso } from "@/modules/ecommerce/hooks/useEcommerceSso";

interface EcommerceEditorButtonProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "disabled"> {}

const EcommerceEditorButton = ({ ...buttonProps }: EcommerceEditorButtonProps) => {
  const { redirectToEcommerceMIN, redirectToEcommerceMAY, loadingMIN, loadingMAY } = useEcommerceSso();
  const loading = loadingMIN || loadingMAY;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} {...buttonProps} className={`gap-2 ${buttonProps.className ?? ""}`}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          Editar Ecommerce
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{ minWidth: "var(--radix-dropdown-menu-trigger-width)" }}
      >
        <DropdownMenuItem onClick={redirectToEcommerceMIN} className="gap-2">
          Minorista
        </DropdownMenuItem>
        <DropdownMenuItem onClick={redirectToEcommerceMAY} className="gap-2">
          Mayorista
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EcommerceEditorButton;
