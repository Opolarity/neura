import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface DocumentType {
  id: number;
  name: string;
  code: string;
}

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    middle_name: '',
    last_name: '',
    last_name2: '',
    document_type_id: '',
    document_number: '',
  });

  useEffect(() => {
    fetchDocumentTypes();
    fetchClient();
  }, [id]);

  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error: any) {
      toast.error('Error al cargar tipos de documento: ' + error.message);
    }
  };

  const fetchClient = async () => {
    try {
      setFetching(true);
      const { data, error } = await (supabase as any)
        .from('accounts')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          middle_name: data.middle_name || '',
          last_name: data.last_name,
          last_name2: data.last_name2 || '',
          document_type_id: data.document_type_id.toString(),
          document_number: data.document_number,
        });
      }
    } catch (error: any) {
      toast.error('Error al cargar cliente: ' + error.message);
      navigate('/customers/list');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.last_name || !formData.document_type_id || !formData.document_number) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('accounts')
        .update({
          name: formData.name,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name,
          last_name2: formData.last_name2 || null,
          document_type_id: parseInt(formData.document_type_id),
          document_number: formData.document_number,
        })
        .eq('id', Number(id));

      if (error) throw error;

      toast.success('Cliente actualizado exitosamente');
      navigate('/customers/list');
    } catch (error: any) {
      toast.error('Error al actualizar cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/customers/list')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Primer Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middle_name">Segundo Nombre</Label>
            <Input
              id="middle_name"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Primer Apellido *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name2">Segundo Apellido</Label>
            <Input
              id="last_name2"
              value={formData.last_name2}
              onChange={(e) => setFormData({ ...formData, last_name2: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Tipo de Documento *</Label>
            <Select
              value={formData.document_type_id}
              onValueChange={(value) => setFormData({ ...formData, document_type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
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
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar Cliente'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customers/list')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;
