import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

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

const Shipping = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
    loadCountries();
  }, []);

  const loadShippingMethods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-methods');
      
      if (error) throw error;
      
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

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-zones');
      
      if (error) throw error;
      
      setCountries(data.countries || []);
    } catch (error: any) {
      console.error('Error loading countries:', error);
    }
  };

  const loadStates = async (countryId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-zones', {
        body: { country_id: countryId },
      });
      
      if (error) throw error;
      
      setStates(data.states || []);
    } catch (error: any) {
      console.error('Error loading states:', error);
    }
  };

  const loadCities = async (countryId: number, stateId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-zones', {
        body: { country_id: countryId, state_id: stateId },
      });
      
      if (error) throw error;
      
      setCities(data.cities || []);
    } catch (error: any) {
      console.error('Error loading cities:', error);
    }
  };

  const loadNeighborhoods = async (countryId: number, stateId: number, cityId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-zones', {
        body: { country_id: countryId, state_id: stateId, city_id: cityId },
      });
      
      if (error) throw error;
      
      setNeighborhoods(data.neighborhoods || []);
    } catch (error: any) {
      console.error('Error loading neighborhoods:', error);
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
    
    // Load dependent zones
    if (field === 'country_id' && value) {
      loadStates(value);
      // Reset dependent fields
      newCosts[index].state_id = undefined;
      newCosts[index].city_id = undefined;
      newCosts[index].neighborhood_id = undefined;
    } else if (field === 'state_id' && value) {
      loadCities(newCosts[index].country_id!, value);
      // Reset dependent fields
      newCosts[index].city_id = undefined;
      newCosts[index].neighborhood_id = undefined;
    } else if (field === 'city_id' && value) {
      loadNeighborhoods(newCosts[index].country_id!, newCosts[index].state_id!, value);
      // Reset dependent field
      newCosts[index].neighborhood_id = undefined;
    }
    
    setCosts(newCosts);
  };

  const handleSubmit = async () => {
    if (!methodName || costs.some(c => !c.name || c.cost <= 0)) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-shipping-method', {
        body: {
          name: methodName,
          code: methodCode,
          costs: costs,
        },
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

  const getZoneDescription = (cost: ShippingCost) => {
    const parts = [];
    if (cost.countries?.name) parts.push(cost.countries.name);
    if (cost.states?.name) parts.push(cost.states.name);
    if (cost.cities?.name) parts.push(cost.cities.name);
    if (cost.neighborhoods?.name) parts.push(cost.neighborhoods.name);
    return parts.length > 0 ? parts.join(' > ') : 'Global';
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

      <div className="grid gap-6">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <CardTitle>{method.name}</CardTitle>
              <CardDescription>
                {method.code && `Código: ${method.code}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {method.shipping_costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.name}</TableCell>
                      <TableCell>{getZoneDescription(cost)}</TableCell>
                      <TableCell>S/ {cost.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {methods.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No hay métodos de envío configurados</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Método
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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
                            onChange={(e) => setCostValue(e.target.value ? Number(e.target.value) : null)}
                            placeholder="0.00"
                          />
                        </div>
              </div>
              {costs.map((cost, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <Input type="hidden" value={costName} readOnly />
                        <Input type="hidden" value={costValue} readOnly />
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
    </div>
  );
};

export default Shipping;
