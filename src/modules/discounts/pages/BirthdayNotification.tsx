import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBirthdayNotifications } from '../hooks/useBirthdayNotifications';
import { BirthdayNotificationTable } from '../components/BirthdayNotificationTable';

const BirthdayNotification = () => {
  const { profiles, loading } = useBirthdayNotifications();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-6">
        <Cake className="w-8 h-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold">Notificaciones de Cumpleaños</h1>
          <p className="text-muted-foreground">
            Clientes con cumpleaños desde 2 días antes hasta 1 día después de hoy
          </p>
        </div>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">
            Clientes en rango de cumpleaños
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <BirthdayNotificationTable profiles={profiles} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BirthdayNotification;
