import { Loader2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BirthdayProfile } from '../types/birthdayNotification.types';

interface BirthdayNotificationTableProps {
  profiles: BirthdayProfile[];
  loading: boolean;
}

const STORE_NAME = 'Overtake';

function getBirthdayStatusBadge(daysOffset: number) {
  if (daysOffset === 0)
    return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">Hoy</Badge>;
  if (daysOffset === 1)
    return <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20">Mañana</Badge>;
  if (daysOffset === -1)
    return <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20">Ayer</Badge>;
  if (daysOffset === 2)
    return <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/20">En 2 días</Badge>;
  if (daysOffset === -2)
    return <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/20">Hace 2 días</Badge>;
  return null;
}

function formatBirthday(birthdayDay: string): string {
  const parts = birthdayDay.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function openWhatsApp(phone: string) {
  const message = `🎂Un detalle de ${STORE_NAME} para ti 🎈\n\n¡Feliz cumple 🥳! 👽🙌\n\nPor ser parte de nuestra comunidad tienes un 20% OFF 🎊 en tus prendas para que estes renovado por tu cumple🛍️\n\n🍰 Canjéalo ingresando a la web, escoge tus productos y de manera automatica se registra tu dscto 🎁\n\n⏳ Disponible desde hoy por 7 días`;
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export const BirthdayNotificationTable = ({
  profiles,
  loading,
}: BirthdayNotificationTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Cumpleaños</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando cumpleaños...
              </div>
            </TableCell>
          </TableRow>
        ) : profiles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground p-10">
              No hay clientes con cumpleaños en este rango de fechas
            </TableCell>
          </TableRow>
        ) : (
          profiles.map((profile) => (
            <TableRow key={profile.uid}>
              <TableCell className="font-medium">{profile.name}</TableCell>
              <TableCell>{profile.phone}</TableCell>
              <TableCell>{formatBirthday(profile.birthdayDay)}</TableCell>
              <TableCell>{getBirthdayStatusBadge(profile.daysOffset)}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => openWhatsApp(profile.phone)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar WhatsApp
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
