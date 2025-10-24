import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import React, {useEffect, useState} from "react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Categories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try{

            setLoading(true);
            const { data: categoriesData, error: categoriesError} = await supabase.from('categories').select('*').neq('id',0);
            if (categoriesError) throw categoriesError;

            setCategories(categoriesData);

        } catch (error: any) {
            toast.error('Error al cargar clientes: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={() => navigate('/')}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>
        <Card>
        <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Productos</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            Cargando categorias...
                        </TableCell>
                    </TableRow>
                ) : categories.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay categorias registradas.
                        </TableCell>
                    </TableRow>
                ) : categories.map((categories) => (
                    <TableRow key={categories.id}>
                        <TableCell>{categories.name}</TableCell>
                        <TableCell>{categories.name}</TableCell>
                        <TableCell>{categories.description}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        </CardContent>
        </Card>
    </div>
    );
};

export default Categories