import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { CreateOrderChannelType, GetModules } from '../services/OrderChannelTypes.services';

interface FormData {
    name: string;
    code: string;
    moduleId: string; // Storing as string for Select value
}

const useCreateOrderChannelType = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [modules, setModules] = useState<{ id: number; name: string; code: string }[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        moduleId: '',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const modulesData = await GetModules();
                setModules(modulesData);
            } catch (error) {
                console.error("Error loading modules:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los módulos",
                    variant: "destructive"
                });
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, moduleId: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name || !formData.code || !formData.moduleId) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        const selectedModule = modules.find(m => m.id.toString() === formData.moduleId);
        if (!selectedModule) {
            toast({
                title: "Error",
                description: "Módulo seleccionado inválido",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            await CreateOrderChannelType({
                name: formData.name,
                code: formData.code,
                moduleID: selectedModule.id,
                moduleCode: selectedModule.code,
            });
            toast({ title: "Éxito", description: "Tipo de canal creado correctamente" });
            navigate('/settings/order-channel-types');
        } catch (error: any) {
            console.error("Error creating order channel type:", error);
            toast({
                title: "Error",
                description: error.message || "Error al crear",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        optionsLoading,
        modules,
        handleChange,
        handleSelectChange,
        handleSubmit
    };
};

export default useCreateOrderChannelType;
