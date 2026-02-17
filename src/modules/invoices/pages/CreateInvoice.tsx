import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, ArrowLeft, Search, FileText } from "lucide-react";
import { useCreateInvoice } from "../hooks/useCreateInvoice";

const CreateInvoice = () => {
  const {
    formData,
    items,
    saving,
    searchingClient,
    invoiceTypes,
    documentTypes,
    totalAmount,
    handleFormChange,
    addItem,
    removeItem,
    updateItem,
    searchClient,
    handleSave,
    navigate,
  } = useCreateInvoice();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Comprobante</h1>
          <p className="text-sm text-muted-foreground">Crear un nuevo comprobante de pago</p>
        </div>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Datos del Comprobante
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Invoice Type */}
          <div className="space-y-2">
            <Label>Tipo de Comprobante *</Label>
            <Select
              value={formData.invoiceTypeId}
              onValueChange={(v) => handleFormChange("invoiceTypeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {invoiceTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serie Tributaria */}
          <div className="space-y-2">
            <Label>Serie Tributaria</Label>
            <Input
              placeholder="Ej: F003-233"
              value={formData.taxSerie}
              onChange={(e) => handleFormChange("taxSerie", e.target.value)}
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Tipo de Documento *</Label>
            <Select
              value={formData.documentTypeId}
              onValueChange={(v) => handleFormChange("documentTypeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id.toString()}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Number + Search */}
          <div className="space-y-2">
            <Label>Nro. Documento *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Número de documento"
                value={formData.clientDocument}
                onChange={(e) => handleFormChange("clientDocument", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchClient();
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => searchClient()}
                disabled={searchingClient}
              >
                {searchingClient ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.clientName && (
              <p className="text-sm text-muted-foreground">
                Cliente: <span className="font-medium text-foreground">{formData.clientName}</span>
              </p>
            )}
          </div>

          {/* Client Email */}
          <div className="space-y-2">
            <Label>Email del Cliente</Label>
            <Input
              type="email"
              placeholder="cliente@email.com"
              value={formData.clientEmail}
              onChange={(e) => handleFormChange("clientEmail", e.target.value)}
            />
          </div>

          {/* Client Address */}
          <div className="space-y-2">
            <Label>Dirección del Cliente</Label>
            <Input
              placeholder="Dirección"
              value={formData.clientAddress}
              onChange={(e) => handleFormChange("clientAddress", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Items del Comprobante</CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Agregar Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead className="w-[90px]">Cantidad</TableHead>
                  <TableHead className="w-[100px]">Unidad</TableHead>
                  <TableHead className="w-[120px]">P. Unitario</TableHead>
                  <TableHead className="w-[100px]">Descuento</TableHead>
                  <TableHead className="w-[100px]">IGV</TableHead>
                  <TableHead className="w-[110px]">Total</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        placeholder="Descripción del item"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", +e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.measurementUnit}
                        onChange={(e) => updateItem(item.id, "measurementUnit", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", +e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, "discount", +e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{item.igv.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{item.total.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Summary */}
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <div />
          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground">
              Subtotal: <span className="font-medium text-foreground">{(totalAmount / 1.18).toFixed(2)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              IGV (18%): <span className="font-medium text-foreground">{(totalAmount - totalAmount / 1.18).toFixed(2)}</span>
            </p>
            <p className="text-lg font-bold text-foreground">
              Total: {totalAmount.toFixed(2)}
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Comprobante
        </Button>
      </div>
    </div>
  );
};

export default CreateInvoice;
