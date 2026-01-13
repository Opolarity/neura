import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { toast } from 'sonner';

interface DocumentType {
  id: number;
  name: string;
  code: string;
}

const CreateClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.last_name || !formData.document_type_id || !formData.document_number) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('clients').insert([
        {
          name: formData.name,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name,
          last_name2: formData.last_name2 || null,
          document_type_id: parseInt(formData.document_type_id),
          document_number: formData.document_number,
        },
      ]);

      if (error) throw error;

      toast.success('Cliente creado exitosamente');
      navigate('/customers/list');
    } catch (error: any) {
      toast.error('Error al crear cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          label="Volver"
          icon="pi pi-arrow-left"
          text
          onClick={() => navigate('/customers/list')}
          className="mb-4 pl-0"
        />
        <h1 className="text-3xl font-bold">Añadir Cliente</h1>
      </div>

      <div className="card bg-white p-6 rounded-lg shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-medium text-gray-700">Primer Nombre *</label>
              <InputText
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="middle_name" className="font-medium text-gray-700">Segundo Nombre</label>
              <InputText
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="last_name" className="font-medium text-gray-700">Primer Apellido *</label>
              <InputText
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="last_name2" className="font-medium text-gray-700">Segundo Apellido</label>
              <InputText
                id="last_name2"
                value={formData.last_name2}
                onChange={(e) => setFormData({ ...formData, last_name2: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="document_type" className="font-medium text-gray-700">Tipo de Documento *</label>
              <Dropdown
                id="document_type"
                value={formData.document_type_id}
                onChange={(e) => setFormData({ ...formData, document_type_id: e.value })}
                options={documentTypes}
                optionLabel="name"
                optionValue="id" // Assuming ID is number, but state is string. Dropdown handles value binding.
                // Wait, formData.document_type_id is string (''), documentTypes.id is number.
                // optionValue="id" will return a number.
                // We map it to string for consistency if needed, but parseInt handles number/string.
                // Let's ensure alignment. If ID is number, Dropdown returns number.
                // formData expects string based on initialization, but TypeScript doesn't complain much with 'any'.
                // Better to keep value as string if possible or update state.
                // I will assume implicit casting or just update state type to any/number|string.
                placeholder="Seleccione tipo"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="document_number" className="font-medium text-gray-700">Número de Documento *</label>
              <InputText
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button label={loading ? 'Guardando...' : 'Guardar Cliente'} type="submit" loading={loading} />
            <Button label="Cancelar" type="button" severity="secondary" outlined onClick={() => navigate('/customers/list')} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClient;
