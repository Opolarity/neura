import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, Loader2 } from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { InventoryTable } from "../components/inventory/InventoryTable";

const Inventory = () => {
  const {
    inventory,
    warehouses,
    loading,
    isEditing,
    isSaving,
    hasChanges,
    handleStockChange,
    handleDefectsChange,
    getStockValue,
    getDefectsValue,
    handleEdit,
    handleCancel,
    handleSave,
  } = useInventory();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Inventario por Almacén
          </h1>
          <p className="text-muted-foreground">
            Gestiona el stock de todas las variaciones
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Stock por Variación</h3>
        </CardHeader>
        <CardContent className="p-0">
          <InventoryTable
            inventory={inventory}
            warehouses={warehouses}
            isEditing={isEditing}
            getStockValue={getStockValue}
            getDefectsValue={getDefectsValue}
            handleStockChange={handleStockChange}
            handleDefectsChange={handleDefectsChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
