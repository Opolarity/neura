import { useEffect, useState } from "react";
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
import { getChannels } from "@/modules/ecommerce/services/sso.service";

interface EcommerceEditorButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, "disabled"> {}

const EcommerceEditorButton = ({ ...buttonProps }: EcommerceEditorButtonProps) => {
  const { redirectToEcommerce, loading } = useEcommerceSso();
  const [channels, setChannels] = useState<{ id: number; name: string, url: string }[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    getChannels()
      .then(setChannels)
      .finally(() => setLoadingChannels(false));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={loading}
          {...buttonProps}
          className={`gap-2 ${buttonProps.className ?? ""}`}
        >
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
        {loadingChannels ? (
          <p className="px-2 py-1.5 text-sm">Cargando...</p>
        ) : (
          channels.map((channel) => (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => redirectToEcommerce(channel.id, channel.url)}
              className="gap-2"
            >
              {channel.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EcommerceEditorButton;