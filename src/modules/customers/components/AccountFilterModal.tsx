import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AccountsFilters, AccountType } from '../types/accounts.types';

interface AccountFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: AccountsFilters) => void;
    onClear: () => void;
    filters: AccountsFilters;
    accountTypes: AccountType[];
}

export const AccountFilterModal = ({
    isOpen,
    onClose,
    onApply,
    onClear,
    filters,
    accountTypes,
}: AccountFilterModalProps) => {
    const [localFilters, setLocalFilters] = useState<AccountsFilters>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        setLocalFilters({
            ...localFilters,
            show: null,
            account_type: null,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filtrar Cuentas</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="show">Estado</Label>
                        <Select
                            value={localFilters.show === null ? 'all' : localFilters.show ? 'active' : 'inactive'}
                            onValueChange={(value) =>
                                setLocalFilters({
                                    ...localFilters,
                                    show: value === 'all' ? null : value === 'active',
                                })
                            }
                        >
                            <SelectTrigger id="show">
                                <SelectValue placeholder="Seleccione estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="inactive">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_type">Tipo de Cuenta</Label>
                        <Select
                            value={localFilters?.account_type ? localFilters.account_type.toString() : 'all'}
                            onValueChange={(value) =>
                                setLocalFilters({
                                    ...localFilters,
                                    account_type: value === 'all' ? null : parseInt(value),
                                })
                            }
                        >
                            <SelectTrigger id="account_type">
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {accountTypes.filter(type => type && type.id).map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClear}>
                            Limpiar
                        </Button>
                        <Button onClick={handleApply}>Aplicar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
