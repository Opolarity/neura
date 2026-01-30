import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Store, Clock, User } from "lucide-react";
import type { CashSession } from "../../types/POS.types";
import { formatTime } from "../../adapters/POS.adapter";

interface POSHeaderProps {
  session: CashSession | null;
  userName?: string;
  onExit: () => void;
}

export default function POSHeader({ session, onExit }: POSHeaderProps) {
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-lg">Sistema POS</span>
        </div>

        {session && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{session.userName}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Sesion iniciada: {formatTime(session.openedAt)}</span>
            </div>

            <Badge variant="outline" className="text-green-600 border-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              SESION ACTIVA
            </Badge>
          </>
        )}

        <Button
          variant="outline"
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          onClick={onExit}
        >
          <LogOut className="w-4 h-4" />
          Salir del POS
        </Button>
      </div>
    </header>
  );
}
