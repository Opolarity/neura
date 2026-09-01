import { Card, CardContent, CardFooter } from '@/components/ui/card';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import { useBirthdayNotifications } from '../hooks/useBirthdayNotifications';
import { BirthdayNotificationTable } from '../components/BirthdayNotificationTable';
import { BirthdayNotificationFilterBar } from '../components/BirthdayNotificationFilterBar';

const BirthdayNotification = () => {
  const {
    profiles,
    loading,
    pagination,
    search,
    onSearchChange,
    onPageChange,
    onPageSizeChange,
  } = useBirthdayNotifications();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Notificaciones de Cumpleaños</h1>
        <p className="text-muted-foreground">
          Clientes con cumpleaños desde 2 días antes hasta 1 día después de hoy
        </p>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <BirthdayNotificationFilterBar search={search} onSearchChange={onSearchChange} />
          <div className="flex-1 min-h-0 overflow-auto">
            <BirthdayNotificationTable profiles={profiles} loading={loading} />
          </div>
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={{
              p_page: pagination.page,
              p_size: pagination.size,
              total: pagination.total,
            }}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default BirthdayNotification;
