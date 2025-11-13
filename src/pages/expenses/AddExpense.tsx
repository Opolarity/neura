import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

const expenseSchema = z.object({
  amount: z.string().min(1, 'El monto es requerido').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser mayor a 0',
  }),
  payment_method_id: z.string().min(1, 'El método de pago es requerido'),
  movement_category_id: z.string().min(1, 'La categoría es requerida'),
  user_id: z.string().optional(),
  description: z.string().optional(),
  movement_date: z.string().min(1, 'La fecha es requerida'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface PaymentMethod {
  id: number;
  name: string;
  business_account_id: number;
  business_accounts: {
    name: string;
  };
}

interface MovementCategory {
  id: number;
  name: string;
}

interface Profile {
  UID: string;
  name: string;
  last_name: string;
}

export default function AddExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<MovementCategory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedBusinessAccount, setSelectedBusinessAccount] = useState<string>('');
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      movement_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedPaymentMethodId = watch('payment_method_id');

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedPaymentMethodId) {
      const selected = paymentMethods.find(pm => pm.id.toString() === selectedPaymentMethodId);
      if (selected && selected.business_accounts) {
        setSelectedBusinessAccount(selected.business_accounts.name);
      } else {
        setSelectedBusinessAccount('');
      }
    } else {
      setSelectedBusinessAccount('');
    }
  }, [selectedPaymentMethodId, paymentMethods]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch payment methods with business accounts
      const { data: pmData, error: pmError } = await (supabase as any)
        .from('payment_methods')
        .select('id, name, business_account_id, business_accounts(name)')
        .eq('active', true)
        .order('name');

      if (pmError) throw pmError;
      setPaymentMethods(pmData || []);

      // Fetch movement categories
      const { data: catData, error: catError } = await (supabase as any)
        .from('movement_categories')
        .select('id, name')
        .order('name');

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch all profiles (users)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('UID, name, last_name')
        .eq('active', true)
        .order('name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch current user's warehouse
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('UID', user.id)
        .single();

      if (userProfileError) throw userProfileError;
      setUserWarehouseId(userProfile?.warehouse_id || null);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user || !userWarehouseId) {
      toast({
        title: 'Error',
        description: 'No se pudo determinar el almacén del usuario',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get movement type for "Egreso"
      const { data: movementTypeData, error: movementTypeError } = await (supabase as any)
        .from('movement_types')
        .select('id')
        .eq('name', 'Egreso')
        .maybeSingle();

      if (movementTypeError) throw movementTypeError;

      if (!movementTypeData) {
        throw new Error('No se encontró el tipo de movimiento "egreso". Por favor, contacta al administrador.');
      }

      const selectedPaymentMethod = paymentMethods.find(
        pm => pm.id.toString() === data.payment_method_id
      );

      if (!selectedPaymentMethod) {
        throw new Error('Método de pago no encontrado');
      }

      // Insert movement
      const { error: insertError } = await (supabase as any)
        .from('movements')
        .insert({
          amount: Number(data.amount),
          payment_method_id: Number(data.payment_method_id),
          business_account_id: selectedPaymentMethod.business_account_id,
          movement_category_id: Number(data.movement_category_id),
          user_id: data.user_id || null,
          warehouse_id: userWarehouseId,
          movement_type_id: movementTypeData.id,
          movement_date: new Date(data.movement_date).toISOString(),
          description: data.description || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Éxito',
        description: 'Gasto registrado correctamente',
      });

      navigate('/movements');
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el gasto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Añadir Gasto</h1>
          <p className="text-muted-foreground">Registra un nuevo gasto en el sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="movement_date">Fecha *</Label>
                <Input
                  id="movement_date"
                  type="date"
                  {...register('movement_date')}
                />
                {errors.movement_date && (
                  <p className="text-sm text-destructive">{errors.movement_date.message}</p>
                )}
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <Label htmlFor="payment_method_id">Método de Pago *</Label>
                <Select
                  onValueChange={(value) => setValue('payment_method_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method_id && (
                  <p className="text-sm text-destructive">{errors.payment_method_id.message}</p>
                )}
              </div>

              {/* Cuenta de Negocio (Bloqueada) */}
              <div className="space-y-2">
                <Label htmlFor="business_account">Cuenta de Negocio</Label>
                <Input
                  id="business_account"
                  value={selectedBusinessAccount}
                  disabled
                  className="bg-muted"
                  placeholder="Selecciona un método de pago"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="movement_category_id">Categoría *</Label>
                <Select
                  onValueChange={(value) => setValue('movement_category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.movement_category_id && (
                  <p className="text-sm text-destructive">{errors.movement_category_id.message}</p>
                )}
              </div>

              {/* Usuario (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="user_id">Usuario (Opcional)</Label>
                <Select
                  onValueChange={(value) => setValue('user_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.UID} value={profile.UID}>
                        {profile.name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Ingresa una descripción del gasto..."
                rows={4}
                {...register('description')}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Gasto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
