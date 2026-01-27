import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import useCreateRole from "../hooks/useCreateRole";
import { RolePayload } from '../types/Roles.types';

interface Function {
  id: number;
  name: string;
  code: string | null;
  icon: string | null;
  location?: string | null;
  parent_function: number | null;
  order?: number | null;
  active?: boolean;
  created_at?: string;
  children?: Function[];
}

const CreateRole = () => {
  const navigate = useNavigate();
  const { id: roleId } = useParams();
  const isEdit = Boolean(roleId);
  const { toast } = useToast();

  const { role, createLoading, createRole, updateLoading, updateRole } = useCreateRole();

  const [formData, setFormData] = useState<RolePayload>({
    id: null,
    name: '',
    admin: false,
    functions: []
  });

  const [functions, setFunctions] = useState<Function[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunctions();
    if (isEdit && roleId) {
      fetchRole(parseInt(roleId));
    } else {
      setLoading(false);
    }
  }, [isEdit, roleId]);

  const fetchFunctions = async () => {
    try {
      const { data, error } = await supabase
        .from('functions')
        .select('*')
        .order('parent_function', { ascending: true });

      if (error) throw error;

      // Build function tree
      console.log("fetchFunctions", data);

      const functionTree = buildFunctionTree(data || []);
      console.log("functionTree", functionTree);
      setFunctions(functionTree);
    } catch (error) {
      console.error('Error fetching functions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las funciones",
        variant: "destructive",
      });
    }
  };

  const fetchRole = async (id: number) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError) throw roleError;

      const { data: roleFunctions, error: functionsError } = await supabase
        .from('role_functions')
        .select('function_id')
        .eq('role_id', id);

      if (functionsError) throw functionsError;

      setFormData({
        name: roleData.name,
        admin: roleData.admin,
        functions: roleFunctions.map(rf => rf.function_id)
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFunctionTree = (functions: Function[]): Function[] => {
    const functionMap = new Map<number, Function>();
    const roots: Function[] = [];

    // First pass: create map of all functions
    functions.forEach(func => {
      functionMap.set(func.id, { ...func, location: func.location || null, children: [] });
    });

    // Second pass: build tree structure
    functions.forEach(func => {
      const funcWithChildren = functionMap.get(func.id);
      if (!funcWithChildren) return;

      if (func.parent_function === null) {
        roots.push(funcWithChildren);
      } else {
        const parent = functionMap.get(func.parent_function);
        if (parent) {
          parent.children!.push(funcWithChildren);
        }
      }
    });

    return roots;
  };

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleFunction = (functionId: number) => {
    const newSelected = new Set(formData.functions);
    if (newSelected.has(functionId)) {
      newSelected.delete(functionId);
    } else {
      newSelected.add(functionId);
    }
    setFormData({
      ...formData,
      functions: Array.from(newSelected)
    });
  };

  const renderFunctionTree = (functions: Function[], level = 0) => {
    return functions.map(func => (
      <div key={func.id} className={`ml-${level * 4}`}>
        <div className="flex items-center gap-2 py-1">
          {func.children && func.children.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleNode(func.id)}
            >
              {expandedNodes.has(func.id) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
          {(!func.children || func.children.length === 0) && (
            <div className="w-6" />
          )}
          <Checkbox
            id={`function-${func.id}`}
            checked={formData.functions.includes(func.id)}
            onCheckedChange={() => toggleFunction(func.id)}
          />
          <Label
            htmlFor={`function-${func.id}`}
            className="text-sm cursor-pointer"
          >
            {func.name}
          </Label>
        </div>
        {func.children && func.children.length > 0 && expandedNodes.has(func.id) && (
          <div className="ml-4">
            {renderFunctionTree(func.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit && roleId) {
        // Update role
        await updateRole({ ...formData, id: parseInt(roleId) });

        toast({
          title: "Éxito",
          description: "Rol actualizado correctamente",
        });
      } else {
        // Create new role
        // Insert role functions
        if (formData.functions.length > 0) {
          await createRole(formData);
        }

        toast({
          title: "Éxito",
          description: "Rol creado correctamente",
        });
      }

      navigate('/settings/roles');
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el rol",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings/roles">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Rol' : 'Crear Rol'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEdit
              ? 'Modifica la información del rol y sus funciones asignadas'
              : 'Completa la información para crear un nuevo rol'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Rol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Rol *</Label>
                  <Input
                    id="name"
                    placeholder="Ingresa el nombre del rol"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin"
                    checked={formData.admin}
                    onCheckedChange={(checked) => setFormData({ ...formData, admin: checked as boolean })}
                  />
                  <Label htmlFor="admin">Rol de Administrador</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los roles de administrador tienen acceso completo al sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funciones Asignadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {renderFunctionTree(functions)}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Selecciona las funciones que tendrá este rol
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Funciones seleccionadas:</p>
                  <p className="text-2xl font-bold text-primary">{formData.functions.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo de rol:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.admin ? 'Administrador' : 'Regular'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full gap-2">
                <Save className="w-4 h-4" />
                {isEdit ? 'Actualizar Rol' : 'Crear Rol'}
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/settings/roles">
                  Cancelar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRole;
