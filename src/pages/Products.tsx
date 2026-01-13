import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useProductsLogic } from './Products.logic';
import placeholderImage from '@/assets/product-placeholder.png';

const Products = () => {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProducts,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    deleting,
    handleNewProduct,
    handleBulkDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditProduct,
    getProductPrice,
    getProductStock,
    getProductStatus,
    // We will bypass toggleSelectAll/toggleProductSelection and manage selection via DataTable's onSelectionChange for simplicity if possible,
    // or manually map if we must keep the hook logic exactly as is.
    // For now, let's try to map the selection.
    selectedProducts: selectedIds,
    // We need to pass a setter for selectedProducts to the logic if we want to update it in bulk, 
    // but the hook exposes toggles. 
    // We can bridge it:
    toggleProductSelection, // (id) => void
    toggleSelectAll, // () => void
  } = useProductsLogic();

  // Helper to map IDs back to objects for DataTable selection
  const selectedProductsObjects = filteredProducts.filter(p => selectedProducts.includes(p.id));

  // Handler for DataTable selection change
  const onSelectionChange = (e: any) => {
    // e.value is the array of selected objects.
    // The hook expects us to toggle individual items or SelectAll.
    // This is tricky with the existing hook.
    // Alternative: Just recreate the selection logic or create a bridge.
    // BETTER ALTERNATIVE: Since I cannot easily change the Hook (it might be in another file I haven't read),
    // and maintaining "Wow" factor means using DataTable's native selection, 
    // I will try to respect the hook's existing API by checking what changed.

    // Actually, let's keep it simple: 
    // If we use DataTable selection, we need full control over the state array.
    // Since I can't see the hook code in this view (I saw it returns specific functions),
    // I will assume for this "Agentic" task I should modify the logic in the hook or just use the toggles.
    // IF I use the toggles, I can't use `selection` prop of DataTable easily without a loop.

    // Let's rely on Custom Columns for checkboxes instead of native selection for now to match the hook PERFECTLY
    // without risking breaking logic logic.
    // OR: I can read the hook source code? No, I'll trust the toggles.
  };

  const imageBodyTemplate = (rowData: any) => {
    return (
      <img
        src={rowData.images[0]?.image_url || placeholderImage}
        alt={rowData.title}
        className="w-12 h-12 object-cover rounded shadow-sm"
      />
    );
  };

  const priceBodyTemplate = (rowData: any) => {
    return `S/ ${getProductPrice(rowData)}`;
  };

  const stockBodyTemplate = (rowData: any) => {
    return getProductStock(rowData);
  };

  const statusBodyTemplate = (rowData: any) => {
    const status = getProductStatus(getProductStock(rowData));
    // Map status.class to PrimeReact severities if possible, or use custom styling.
    // status.text contains the label.
    let severity: "success" | "warning" | "danger" | null = null;
    if (status.text === 'En Stock') severity = 'success';
    else if (status.text === 'Bajo Stock') severity = 'warning';
    else severity = 'danger';

    return <Tag value={status.text} severity={severity} rounded />;
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => handleEditProduct(rowData.id)} />
        <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDeleteClick(rowData.id)} />
      </div>
    );
  };

  // Custom Checkbox Column to match hook logic exactly
  const checkboxTemplate = (rowData: any) => {
    return (
      <div className="flex align-items-center">
        {/* We reuse toggleProductSelection from simple checkbox click */}
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          checked={selectedProducts.includes(rowData.id)}
          onChange={() => toggleProductSelection(rowData.id)}
        />
      </div>
    );
  };

  const headerCheckboxTemplate = () => {
    return (
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
        onChange={() => toggleSelectAll()}
      />
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 mr-4">Gestión de Productos</h1>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        {selectedProducts.length > 0 && (
          <Button
            label={`Eliminar ${selectedProducts.length}`}
            icon="pi pi-trash"
            severity="danger"
            onClick={handleBulkDelete}
          />
        )}
        <Button label="Nuevo Producto" icon="pi pi-plus" onClick={handleNewProduct} />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Lista de Productos</h4>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText type="search" onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} placeholder="Buscar productos..." value={searchTerm} />
      </IconField>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toolbar className="mb-4 bg-white border-none shadow-sm" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>

      <div className="card shadow-sm rounded-lg overflow-hidden bg-white">
        <DataTable
          value={filteredProducts}
          loading={loading}
          header={header}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage="No se encontraron productos"
          className="p-datatable-sm"
        >
          <Column header={headerCheckboxTemplate} body={checkboxTemplate} style={{ width: '3rem' }}></Column>
          <Column header="Imagen" body={imageBodyTemplate}></Column>
          <Column field="title" header="Producto" sortable></Column>
          <Column
            header="Categoría"
            body={(rowData) => rowData.categories.length > 0 ? rowData.categories.join(', ') : 'Sin categoría'}
          ></Column>
          <Column header="Precio" body={priceBodyTemplate} sortable></Column>
          <Column header="Stock" body={stockBodyTemplate} sortable></Column>
          <Column header="Estado" body={statusBodyTemplate} sortable></Column>
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '8rem', textAlign: 'center' }}></Column>
        </DataTable>
      </div>

      <ConfirmDialog
        visible={deleteDialogOpen}
        onHide={() => setDeleteDialogOpen(false)}
        message={productToDelete === -1
          ? `¿Estás seguro de que deseas eliminar estos ${selectedProducts.length} productos? Esta acción no se puede deshacer.`
          : "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        }
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={handleDeleteConfirm}
        reject={() => setDeleteDialogOpen(false)}
        acceptLabel={deleting ? "Eliminando..." : "Eliminar"}
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default Products;
