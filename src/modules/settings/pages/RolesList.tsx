import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Shield, UserCheck, ListFilter, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import RolesFilterModal, { RoleFilters } from '../components/RolesFilterModal';

interface Role {
  id: number;
  name: string;
  is_admin: boolean;
  functions?: any[];
  users: number;
}

const RolesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<RoleFilters>({
    is_admin: null,
    minprice: null,
    maxprice: null,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, [pagination.p_page, pagination.p_size, filters]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-roles', {
        method: 'GET',
        params: {
          page: pagination.p_page,
          size: pagination.p_size,
          is_admin: filters.is_admin,
          minprice: filters.minprice,
          maxprice: filters.maxprice,
        }
      });

      if (error) throw error;

      if (data && data.rolesdata) {
        setRoles(data.rolesdata.data || []);
        setPagination({
          p_page: data.rolesdata.page.page,
          p_size: data.rolesdata.page.size,
          total: data.rolesdata.page.total
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onApplyFilters = (newFilters: RoleFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, p_page: 1 }));
    setIsFilterModalOpen(false);
  };

  const onPageChange = (page: number) => {
    setPagination(prev => ({ ...prev, p_page: page }));
  };

  const onPageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, p_size: size, p_page: 1 }));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;

    try {
      const { error } = await supabase.functions.invoke('delete-role', {
        body: { id: roleId }
      });

      if (error) throw error;

      setRoles(roles.filter(role => role.id !== roleId));
      toast({
        title: "Éxito",
        description: "Rol eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listado de Roles</h1>
          <p className="text-muted-foreground mt-2">
            Administra los roles del sistema y sus funciones asignadas
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/settings/roles/create">
            <Plus className="w-4 h-4" />
            Nuevo Rol
          </Link>
        </Button>
      </div>

      {/* Roles Table Card - Includes search and filter bar aligned like products */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <ListFilter className="w-4 h-4" />
              Filtrar
            </Button>
            <Button variant="outline">Exportar</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Funciones</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Cargando roles...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron roles
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-sm">{role.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div className="font-medium">{role.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_admin ? 'destructive' : 'secondary'} className="gap-1">
                        {role.is_admin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {role.is_admin ? 'Administrador' : 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{(role.functions?.length) || 0} funciones</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{role.users || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/settings/roles/edit/${role.id}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <RolesFilterModal
        isOpen={isFilterModalOpen}
        filters={filters}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={onApplyFilters}
      />
    </div>
  );
};

export default RolesList;

