import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CreateUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    middle_name: '',
    last_name: '',
    last_name2: '',
    document_type_id: '',
    document_number: '',
    email: '',
    password: '',
    phone: '',
    country_id: '',
    state_id: '',
    city_id: '',
    neighborhood_id: '',
    address: '',
    address_reference: '',
    warehouse_id: '',
    branch_id: '',
    is_active: true
  });

  // Master Data State
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.country_id) {
      fetchStates(Number(formData.country_id));
    } else {
      setStates([]);
    }
  }, [formData.country_id]);

  useEffect(() => {
    if (formData.state_id) {
      fetchCities(Number(formData.state_id));
    } else {
      setCities([]);
    }
  }, [formData.state_id]);

  useEffect(() => {
    if (formData.city_id) {
      fetchNeighborhoods(Number(formData.city_id));
    } else {
      setNeighborhoods([]);
    }
  }, [formData.city_id]);

  const fetchInitialData = async () => {
    try {
      const [docTypesRes, countriesRes, branchesRes] = await Promise.all([
        supabase.from('document_types').select('id, name').order('name'),
        supabase.from('countries').select('id, name').order('name'),
        supabase.from('branches').select('id, name, warehouse_id').order('name')
      ]);

      if (docTypesRes.error) throw docTypesRes.error;
      if (countriesRes.error) throw countriesRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setDocumentTypes(docTypesRes.data || []);
      setCountries(countriesRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchStates = async (countryId: number) => {
    const { data, error } = await supabase.from('states').select('id, name').eq('country_id', countryId).order('name');
    if (!error) setStates(data || []);
  };

  const fetchCities = async (stateId: number) => {
    const { data, error } = await supabase.from('cities').select('id, name').eq('state_id', stateId).order('name');
    if (!error) setCities(data || []);
  };

  const fetchNeighborhoods = async (cityId: number) => {
    const { data, error } = await supabase.from('neighborhoods').select('id, name').eq('city_id', cityId).order('name');
    if (!error) setNeighborhoods(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map form data to payload (ensuring numbers where needed)
      const payload = {
        ...formData,
        document_type_id: Number(formData.document_type_id),
        country_id: formData.country_id ? Number(formData.country_id) : null,
        state_id: formData.state_id ? Number(formData.state_id) : null,
        city_id: formData.city_id ? Number(formData.city_id) : null,
        neighborhood_id: formData.neighborhood_id ? Number(formData.neighborhood_id) : null,
        warehouse_id: Number(formData.warehouse_id),
        branch_id: Number(formData.branch_id)
      };

      const { data, error } = await supabase.functions.invoke('create-users', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      });
      navigate('/settings/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/users')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Usuario</h1>
            <p className="text-gray-600 text-sm">Registra un nuevo usuario en el sistema</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/settings/users')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Usuario'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Primer Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Segundo Nombre</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  placeholder="Ej: Carlos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Primer Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Ej: Pérez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name2">Segundo Apellido</Label>
                <Input
                  id="last_name2"
                  value={formData.last_name2}
                  onChange={(e) => setFormData({ ...formData, last_name2: e.target.value })}
                  placeholder="Ej: Rodríguez"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Identificación y Credenciales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identificación y Credenciales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type_id">Tipo de Documento *</Label>
                <Select
                  value={formData.document_type_id}
                  onValueChange={(value) => setFormData({ ...formData, document_type_id: value })}
                >
                  <SelectTrigger id="document_type_id">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id.toString()}>{dt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">Número de Documento *</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Contraseña Temporal *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defina una contraseña inicial"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Dirección */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dirección y Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country_id">País</Label>
                <Select
                  value={formData.country_id}
                  onValueChange={(value) => setFormData({ ...formData, country_id: value, state_id: '', city_id: '', neighborhood_id: '' })}
                >
                  <SelectTrigger id="country_id">
                    <SelectValue placeholder="Seleccione país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_id">Departamento / Estado</Label>
                <Select
                  disabled={!formData.country_id}
                  value={formData.state_id}
                  onValueChange={(value) => setFormData({ ...formData, state_id: value, city_id: '', neighborhood_id: '' })}
                >
                  <SelectTrigger id="state_id">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city_id">Ciudad</Label>
                <Select
                  disabled={!formData.state_id}
                  value={formData.city_id}
                  onValueChange={(value) => setFormData({ ...formData, city_id: value, neighborhood_id: '' })}
                >
                  <SelectTrigger id="city_id">
                    <SelectValue placeholder="Seleccione ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood_id">Barrio</Label>
                <Select
                  disabled={!formData.city_id}
                  value={formData.neighborhood_id}
                  onValueChange={(value) => setFormData({ ...formData, neighborhood_id: value })}
                >
                  <SelectTrigger id="neighborhood_id">
                    <SelectValue placeholder="Seleccione barrio" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods.map((n) => (
                      <SelectItem key={n.id} value={n.id.toString()}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_reference">Referencia</Label>
                <Input
                  id="address_reference"
                  value={formData.address_reference}
                  onChange={(e) => setFormData({ ...formData, address_reference: e.target.value })}
                  placeholder="Ej: Puerta roja, frente al parque"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch_id">Sucursal Asignada *</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => {
                    const branch = branches.find(b => b.id.toString() === value);
                    setFormData({
                      ...formData,
                      branch_id: value,
                      warehouse_id: branch?.warehouse_id?.toString() || ''
                    });
                  }}
                >
                  <SelectTrigger id="branch_id">
                    <SelectValue placeholder="Seleccione sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Usuario Activo</Label>
                <Switch
                  id="isActive"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;