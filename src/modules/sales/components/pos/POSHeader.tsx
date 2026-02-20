import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Store, Clock } from "lucide-react";
import type { POSSession } from "../../types/POS.types";
import { formatTime } from "../../adapters/POS.adapter";

interface POSHeaderProps {
  session: POSSession | null;
  onExit: () => void;
}

export default function POSHeader({ session, onExit }: POSHeaderProps) {
  return (
    <header className="bg-white border-b px-4 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm">Sistema POS</span>
      </div>

      <div className="flex items-center gap-3">
        {session && (
          <>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(session.openedAt)}
            </span>

            <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] px-1.5 py-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
              ACTIVA
            </Badge>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
          onClick={onExit}
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </Button>
      </div>
    </header>
  );
}
