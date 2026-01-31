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
import { Tags, Warehouse, ArrowRight, RefreshCw, Info, Headphones, Zap } from "lucide-react";
import type { PriceList } from "../../../types";

interface ConfigurationStepProps {
  priceLists: PriceList[];
  userWarehouseName: string;
  onConfirm: (priceListId: string) => void;
}

export default function ConfigurationStep({
  priceLists,
  userWarehouseName,
  onConfirm,
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
        <p className="text-gray-500 mt-1">
          Configure los parametros iniciales para comenzar el proceso.
        </p>
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
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4 text-blue-600" />
                <Label className="text-xs font-medium text-gray-500 uppercase">
                  Lista de Precios
                </Label>
              </div>
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
              <p className="text-xs text-gray-500">
                Los descuentos y promociones se aplicaran segun esta seleccion.
              </p>
            </div>

            {/* Warehouse (auto-assigned) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-orange-600" />
                <Label className="text-xs font-medium text-gray-500 uppercase">
                  Almacen de Despacho
                </Label>
              </div>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center text-gray-600">
                {userWarehouseName || "Sin almacen asignado"}
              </div>
              <p className="text-xs text-gray-500">
                Se validara el stock disponible en tiempo real en la ubicacion elegida.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" className="gap-2">
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

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Dato Util</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Verifique que la impresora de tickets este encendida antes de proceder al pago.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Headphones className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Soporte</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Si tiene problemas con el stock, contacte al supervisor de bodega.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Venta Rapida</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Puede usar <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt + R</kbd> para repetir la ultima configuracion valida.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
