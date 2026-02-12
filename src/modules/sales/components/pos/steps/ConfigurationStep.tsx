import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tags, Warehouse, ArrowRight, RefreshCw } from "lucide-react";
import type { PriceList } from "../../../types";

interface ConfigurationStepProps {
  priceLists: PriceList[];
  userWarehouseName: string;
  onConfirm: (priceListId: string) => void;
  onReset: () => void;
}

export default function ConfigurationStep({
  priceLists,
  userWarehouseName,
  onConfirm,
  onReset,
}: ConfigurationStepProps) {
  const [selectedPriceList, setSelectedPriceList] = useState<string>("");

  const handleSubmit = () => {
    if (selectedPriceList) {
      onConfirm(selectedPriceList);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Configuracion de Venta</CardTitle>
          <CardDescription>
            Defina el almacen y la lista de precios para cargar el catalogo de productos correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Price List */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase">
                  Lista de Precios
                </Label>
              <Select value={selectedPriceList} onValueChange={setSelectedPriceList}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione lista de precios..." />
                </SelectTrigger>
                <SelectContent>
                  {priceLists.map((priceList) => (
                    <SelectItem key={priceList.id} value={priceList.id.toString()}>
                      {priceList.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse (auto-assigned) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase">
                  Almacen de Despacho
                </Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center text-gray-600">
                {userWarehouseName || "Sin almacen asignado"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" className="gap-2" onClick={onReset}>
              <RefreshCw className="w-4 h-4" />
              Restablecer
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPriceList}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Comenzar Venta
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
