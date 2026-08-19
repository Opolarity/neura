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
import BranchesFilterModal from '../components/branches/BranchesFilterModal';
import { BranchDeleteDialog } from '../components/branches/BranchDeleteDialog';
import type { BranchView } from '../types/Branches.types';
import { ComponentPermission } from '@/shared/components/component-permission';

const BranchesList = () => {
    const {
        branches,
        loading,
        pagination,
        search,
        filters,
        hasActiveFilters,
        handlePageChange,
        handleSizeChange,
        handleSearchChange,
        handleDeleteBranch,
        handleApplyFilter
    } = useBranches(); // Ensure useBranches exposes these

    const [isOpenFilterModal, setIsOpenFilterModal] = React.useState(false);
    const [branchToDelete, setBranchToDelete] = React.useState<BranchView | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleOpenFilterModal = () => setIsOpenFilterModal(true);
    const handleCloseFilterModal = () => setIsOpenFilterModal(false);

    // El botón de la fila abría el borrado directo: un clic accidental se
    // llevaba la sucursal sin vuelta atrás. Ahora pasa por BranchDeleteDialog,
    // que ya existía en el módulo.
    const handleConfirmDelete = async () => {
        if (!branchToDelete) return;
        setIsDeleting(true);
        await handleDeleteBranch(branchToDelete.id);
        setIsDeleting(false);
        setBranchToDelete(null);
    };

    return (
        <div className="h-full min-h-0 flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listado de Sucursales</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra las sucursales del sistema
                    </p>
                </div>
                {/* El botón lleva a /settings/branches/create, ya protegida con
                    branches.create: se reutiliza ese code para no ofrecer un
                    botón que acaba en una pantalla bloqueada. */}
                <ComponentPermission codeIn={["branches.create"]}>
                    <Button asChild className="gap-2">
                        <Link to="/settings/branches/create">
                            <Plus className="w-4 h-4" />
                            Crear Sucursal
                        </Link>
                    </Button>
                </ComponentPermission>
            </div>

            {/* Branches Table */}
            <Card className="flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="!p-4">
                    <BranchesFilterBar
                        search={search}
                        onSearchChange={handleSearchChange}
                        onOpen={handleOpenFilterModal}
                        hasActiveFilters={hasActiveFilters}
                    />
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                    <BranchesTable
                        branches={branches}
                        loading={loading}
                        onDeleteClick={setBranchToDelete}
                    />
                </CardContent>
                <CardFooter className="!p-0">
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handleSizeChange}
                    />
                </CardFooter>
            </Card>

            <BranchesFilterModal
                isOpen={isOpenFilterModal}
                onClose={handleCloseFilterModal}
                onApply={handleApplyFilter}
                filters={filters}
            />

            <BranchDeleteDialog
                open={!!branchToDelete}
                onOpenChange={(open) => !open && setBranchToDelete(null)}
                branch={branchToDelete}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default BranchesList;
