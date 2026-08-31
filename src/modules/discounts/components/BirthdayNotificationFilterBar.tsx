import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BirthdayNotificationFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * Buscador de la pantalla de cumpleanos. Filtra contra el servidor (nombre
 * y telefono), no sobre la pagina que se esta viendo: escribir aqui busca
 * en todos los cumpleanos de la ventana, no solo en los 20 visibles.
 * El debounce lo pone useBirthdayNotifications.
 */
export const BirthdayNotificationFilterBar = ({
  search,
  onSearchChange,
}: BirthdayNotificationFilterBarProps) => (
  <div className="flex items-center gap-2 p-4">
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nombre o teléfono..."
        className="pl-9"
      />
    </div>
  </div>
);
