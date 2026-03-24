import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBirthdayNotifications } from '../hooks/useBirthdayNotifications';
import { BirthdayNotificationTable } from '../components/BirthdayNotificationTable';

const BirthdayNotification = () => {
  const { profiles, loading } = useBirthdayNotifications();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Cake className="w-8 h-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold">Notificaciones de Cumpleaños</h1>
          <p className="text-muted-foreground">
            Clientes con cumpleaños desde 2 días antes hasta 1 día después de hoy
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Clientes en rango de cumpleaños
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BirthdayNotificationTable profiles={profiles} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BirthdayNotification;
