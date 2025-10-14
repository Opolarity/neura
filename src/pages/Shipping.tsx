import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';

interface ShippingCost {
  id?: number;
  name: string;
  cost: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  neighborhood_id?: number;
  countries?: { id: number; name: string };
  states?: { id: number; name: string };
  cities?: { id: number; name: string };
  neighborhoods?: { id: number; name: string };
}

interface ShippingMethod {
  id: number;
  name: string;
  code?: string;
  shipping_costs: ShippingCost[];
}

interface locationData {
  countries: any[];
  states: any[];
  cities: any[];
  neighborhoods: any[];
}


const Shipping = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [locationData, setLocationData] = useState<locationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Names nad costs
  const [costName, setCostName] = useState('');
  const [costValue, setCostValue] = useState<number | null>(null);


  // Form states
  const [methodName, setMethodName] = useState('');
  const [methodCode, setMethodCode] = useState('');
  const [costs, setCosts] = useState<ShippingCost[]>([{
    name: '',
    cost: 0,
  }]);

  // Zone selection states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    loadShippingMethods();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      loadLocations();
    }
  }, [dialogOpen]);

  const loadLocations = async (params?: {
    country_id?: number;
    state_id?: number;
    city_id?: number;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-locations', {
        body: params || {},
      });
      if (error) throw error;

      console.log("📦 Datos recibidos:", data);

      if (!params) {
        // Nivel 1: países
        setCountries(data.countries || []);
      } else if (params.country_id && !params.state_id && !params.city_id) {
        // Nivel 2: departamentos
        setStates(data.states || []);
        setCities([]);
        setNeighborhoods([]);
      } else if (params.country_id && params.state_id && !params.city_id) {
        // Nivel 3: provincias
        setCities(data.cities || []);
        setNeighborhoods([]);
      } else if (params.country_id && params.state_id && params.city_id) {
        // Nivel 4: distritos
        setNeighborhoods(data.neighborhoods || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las ubicaciones.",
        variant: "destructive",
      });
    }
  };

  const loadShippingMethods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-methods');
      if (error) throw error;
      
      console.log('📦 Métodos de envío recibidos:', data.methods);
      setMethods(data.methods || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los métodos de envío",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCost = () => {
    setCosts([...costs, { name: '', cost: 0 }]);
  };

  const handleRemoveCost = (index: number) => {
    if (costs.length > 1) {
      setCosts(costs.filter((_, i) => i !== index));
    }
  };

  const handleCostChange = (index: number, field: keyof ShippingCost, value: any) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], [field]: value };
    
    if (field === 'country_id' && value) {
      loadLocations({ country_id: value });
      newCosts[index].state_id = undefined;
      newCosts[index].city_id = undefined;
      newCosts[index].neighborhood_id = undefined;
    } else if (field === 'state_id' && value) {
      loadLocations({
        country_id: newCosts[index].country_id!,
        state_id: value,
      });
      newCosts[index].city_id = undefined;
      newCosts[index].neighborhood_id = undefined;
    } else if (field === 'city_id' && value) {
      loadLocations({
        country_id: newCosts[index].country_id!,
        state_id: newCosts[index].state_id!,
        city_id: value,
      });
      newCosts[index].neighborhood_id = undefined;
    }

    
    setCosts(newCosts);
  };

  const handleSubmit = async () => {
    if (!methodName.trim() || !costName.trim() || costValue === null || costValue <= 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Make Cost name and value general for all shipping cost
      const formattedCosts =    costs.map(cost => ({
        ...cost,
        name: costName,
        cost: costValue,
      }));

      const { data, error } = await supabase.functions.invoke('create-shipping-method', {
        body: JSON.stringify({
          name: methodName,
          code: methodCode,
          costs: formattedCosts,
        }),
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Método de envío creado correctamente",
      });

      setDialogOpen(false);
      resetForm();
      loadShippingMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el método de envío",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMethodName('');
    setMethodCode('');
    setCosts([{ name: '', cost: 0 }]);
    setStates([]);
    setCities([]);
    setNeighborhoods([]);
  };

  const getAllZones = (method: ShippingMethod) => {
    if (!method.shipping_costs || method.shipping_costs.length === 0) return 'Global';
    
    console.log('🗺️ Procesando zonas para método:', method.name, method.shipping_costs);
    
    return method.shipping_costs.map(cost => {
      const zp = (cost as any).zone_path;
      if (zp) return zp;

      const parts = [] as string[];
      const country = (cost as any).countries;
      const state = (cost as any).states;
      const city = (cost as any).cities;
      const neighborhood = (cost as any).neighborhoods;

      console.log('📍 Costo individual:', { cost, country, state, city, neighborhood });

      if (neighborhood?.name) {
        if (country?.name) parts.push(country.name);
        if (state?.name) parts.push(state.name);
        if (city?.name) parts.push(city.name);
        parts.push(neighborhood.name);
      } else if (city?.name) {
        if (country?.name) parts.push(country.name);
        if (state?.name) parts.push(state.name);
        parts.push(city.name);
      } else if (state?.name) {
        if (country?.name) parts.push(country.name);
        parts.push(state.name);
      } else if (country?.name) {
        parts.push(country.name);
      }

      return parts.length > 0 ? parts.join(' > ') : 'Global';
    }).join(' | ');
  };

  const handleDeleteClick = (methodId: number) => {
    setMethodToDelete(methodId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', methodToDelete);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Método de envío eliminado correctamente",
      });

      loadShippingMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el método de envío",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Envío</h1>
          <p className="text-muted-foreground">Gestiona los métodos de envío y sus costos por zona</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Método
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lista de Métodos de Envío</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No hay métodos de envío configurados</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Método
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Zonas</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => {
                  const firstCost = method.shipping_costs?.[0];
                  const allZones = getAllZones(method);

                  return (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.code || '—'}</TableCell>
                      <TableCell>{allZones}</TableCell>
                      <TableCell>
                        {firstCost?.cost == null ? 'Gratis' : `S/ ${firstCost.cost}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar edición
                              toast({
                                title: "Próximamente",
                                description: "La función de editar estará disponible pronto",
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(method.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Método de Envío</DialogTitle>
            <DialogDescription>
              Configure el método de envío y sus costos por zona
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="Ej: Envío Express"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={methodCode}
                  onChange={(e) => setMethodCode(e.target.value)}
                  placeholder="Ej: EXPRESS"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Costos por Zona *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCost}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Zona
                </Button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={costName}
                            onChange={(e) => setCostName(e.target.value)}
                            placeholder="Ej: Envío a Lima"
                          />
                        </div>

                         <div className="space-y-2">
                          <Label>Costo (S/) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={costValue ?? 0}
                            onChange={(e) => setCostValue(e.target.value ? Number(e.target.value) : 0)}
                            placeholder="0.00"
                          />
                        </div>
              </div>
              {costs.map((cost, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>País</Label>
                          <Select
                            value={cost.country_id?.toString()}
                            onValueChange={(value) => handleCostChange(index, 'country_id', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione país" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id.toString()}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Departamento</Label>
                          <Select
                            value={cost.state_id?.toString()}
                            onValueChange={(value) => handleCostChange(index, 'state_id', parseInt(value))}
                            disabled={!cost.country_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione departamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.id} value={state.id.toString()}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Provincia</Label>
                          <Select
                            value={cost.city_id?.toString()}
                            onValueChange={(value) => handleCostChange(index, 'city_id', parseInt(value))}
                            disabled={!cost.state_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione provincia" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city.id} value={city.id.toString()}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Distrito</Label>
                          <Select
                            value={cost.neighborhood_id?.toString()}
                            onValueChange={(value) => handleCostChange(index, 'neighborhood_id', parseInt(value))}
                            disabled={!cost.city_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione distrito" />
                            </SelectTrigger>
                            <SelectContent>
                              {neighborhoods.map((neighborhood) => (
                                <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                                  {neighborhood.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {costs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCost(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Método
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar método de envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el método de envío y todos sus costos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipping;
