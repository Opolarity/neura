import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import { CardFooter } from '@/components/ui/card';
import BranchesTable from '../components/branches/BranchesTable';
import useBranches from '../hooks/useBranches';
import BranchesFilterBar from '../components/branches/BranchesFilterBar';

const BranchesList = () => {
    const {
        branches,
        loading,
        pagination,
        search,
        handlePageChange,
        handleSizeChange,
        handleSearchChange,
        handleDeleteBranch
    } = useBranches();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listado de Sucursales</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra las sucursales del sistema
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link to="/settings/branches/create">
                        <Plus className="w-4 h-4" />
                        Crear Sucursal
                    </Link>
                </Button>
            </div>


            {/* Branches Table */}
            <Card>
                <CardHeader>
                    <BranchesFilterBar
                        search={search}
                        onSearchChange={handleSearchChange}
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <BranchesTable
                        branches={branches}
                        loading={loading}
                        handleDeleteBranch={handleDeleteBranch}
                    />
                </CardContent>
                <CardFooter>
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handleSizeChange}
                    />
                </CardFooter>
            </Card>
        </div>
    );
};

export default BranchesList;
