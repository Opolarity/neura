import React, { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Loader2, Plus, Trash2, ArrowLeft, Search, FileText, Send, FileDown, Eye, Copy, Link as LinkIcon, ExternalLink } from "lucide-react";
import OrderSelectionModal from "../components/invoices/OrderSelectionModal";
import MovementSelectionModal from "../components/invoices/MovementSelectionModal";
import { useCreateInvoice } from "../hooks/useCreateInvoice";
import { useToast } from "@/hooks/use-toast";

const CreateInvoice = ({ viewOnly = false }: { viewOnly?: boolean }) => {
  const { toast } = useToast();
  const {
    formData,
    items,
    saving,
    emitting,
    loading,
    isEditing,
    declared,
    pdfUrl,
    xmlUrl,
    cdrUrl,
    searchingClient,
    invoiceTypes,
    documentTypes,
    invoiceProviders,
    invoiceSeries,
    totalAmount,
    handleFormChange,
    addItem,
    removeItem,
    updateItem,
    searchClient,
    loadOrderData,
    handleSave,
    handleEmit,
    navigate,
    invoiceId,
  } = useCreateInvoice();

  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
           <h1 className="text-2xl font-bold text-foreground">{viewOnly ? "Ver Comprobante" : isEditing ? "Editar Comprobante" : "Nuevo Comprobante"}</h1>
            <p className="text-sm text-muted-foreground">{viewOnly ? "Detalle del comprobante de pago" : isEditing ? "Modificar comprobante existente" : "Crear un nuevo comprobante de pago"}</p>
          </div>
        </div>
        {isEditing && (pdfUrl || xmlUrl || cdrUrl) && (
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}>
                <Eye className="h-4 w-4 mr-1" /> PDF
              </Button>
            )}
            {xmlUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(xmlUrl, '_blank', 'noopener,noreferrer')}>
                <FileDown className="h-4 w-4 mr-1" /> XML
              </Button>
            )}
            {cdrUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(cdrUrl, '_blank', 'noopener,noreferrer')}>
                <FileDown className="h-4 w-4 mr-1" /> CDR
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Datos del Comprobante
          </CardTitle>
          {!viewOnly && (
            <div className="flex items-center gap-2">
              {formData.orderId ? (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  <LinkIcon className="h-3 w-3" />
                  Pedido #{formData.orderId}
                  <button 
                    onClick={() => setIsOrderModalOpen(true)}
                    className="ml-1 hover:text-blue-900"
                    title="Cambiar pedido vinculado"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => handleFormChange("orderId", "")}
                    className="ml-1 hover:text-red-600"
                    title="Desvincular pedido"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsOrderModalOpen(true)}
                  className="text-xs h-8"
                >
                  <LinkIcon className="h-3 w-3 mr-1" /> Vincular a Pedido
                </Button>
              )}

              {formData.movementId ? (
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                  <LinkIcon className="h-3 w-3" />
                  Movimiento #{formData.movementId}
                  <button 
                    onClick={() => setIsMovementModalOpen(true)}
                    className="ml-1 hover:text-purple-900"
                    title="Cambiar movimiento vinculado"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => handleFormChange("movementId", "")}
                    className="ml-1 hover:text-red-600"
                    title="Desvincular movimiento"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsMovementModalOpen(true)}
                  className="text-xs h-8"
                >
               <LinkIcon className="h-3 w-3 mr-1" /> Vincular a Movimiento
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Invoice Type */}
          <div className="space-y-2">
            <Label>Tipo de Comprobante *</Label>
            <Select
              value={formData.invoiceTypeId}
              onValueChange={(v) => handleFormChange("invoiceTypeId", v)}
              disabled={viewOnly}
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

          {/* Invoice Provider */}
          <div className="space-y-2">
            <Label>Proveedor de Facturación *</Label>
            <Select
              value={formData.invoiceProviderId}
              onValueChange={(v) => handleFormChange("invoiceProviderId", v)}
              disabled={viewOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {invoiceProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.description || `Proveedor ${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Serie */}
          <div className="space-y-2">
            <Label>Serie *</Label>
            <Select
              value={formData.invoiceSerieId}
              onValueChange={(v) => {
                handleFormChange("invoiceSerieId", v);
                const serie = invoiceSeries.find((s) => s.id.toString() === v);
                if (serie) {
                  handleFormChange("taxSerie", serie.serie || "");
                }
              }}
              disabled={viewOnly || !formData.invoiceProviderId}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.invoiceProviderId ? "Seleccionar serie" : "Seleccione proveedor primero"} />
              </SelectTrigger>
              <SelectContent>
                {invoiceSeries.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.serie || "-"} (#{s.next_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Tipo de Documento *</Label>
            <Select
              value={formData.documentTypeId}
              onValueChange={(v) => handleFormChange("documentTypeId", v)}
              disabled={viewOnly}
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
                disabled={viewOnly}
              />
              {!viewOnly && (
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
              )}
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
              disabled={viewOnly}
            />
          </div>

          {/* Client Address */}
          <div className="space-y-2">
            <Label>Dirección del Cliente</Label>
            <Input
              placeholder="Dirección"
              value={formData.clientAddress}
              onChange={(e) => handleFormChange("clientAddress", e.target.value)}
              disabled={viewOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Items del Comprobante</CardTitle>
          {!viewOnly && (
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Item
            </Button>
          )}
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
                  {!viewOnly && <TableHead className="w-[50px]" />}
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
                        disabled={viewOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", +e.target.value)}
                        disabled={viewOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.measurementUnit}
                        onChange={(e) => updateItem(item.id, "measurementUnit", e.target.value)}
                        disabled={viewOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", +e.target.value)}
                        disabled={viewOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, "discount", +e.target.value)}
                        disabled={viewOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{item.igv.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{item.total.toFixed(2)}</span>
                    </TableCell>
                    {!viewOnly && (
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
                    )}
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
          {viewOnly ? "Volver" : "Cancelar"}
        </Button>
        {!viewOnly && isEditing && !declared && (
          <Button variant="secondary" onClick={handleEmit} disabled={emitting}>
            {emitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Emitir en SUNAT
          </Button>
        )}
        {isEditing && declared && (
          <span className="flex items-center text-sm text-primary font-medium px-3">
            ✓ Emitido en SUNAT
          </span>
        )}
        {!viewOnly && (
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Actualizar Comprobante" : "Guardar Comprobante"}
          </Button>
        )}
      </div>

      <OrderSelectionModal 
        mode="link"
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        currentInvoiceId={invoiceId ? parseInt(invoiceId) : undefined}
        onSelect={(orderId) => {
          handleFormChange("orderId", orderId.toString());
          toast({ title: "Pedido vinculado correctamente" });
        }}
      />
      <MovementSelectionModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        currentInvoiceId={invoiceId ? parseInt(invoiceId) : undefined}
        onSelect={(movementId) => {
          handleFormChange("movementId", movementId.toString());
          toast({ title: "Movimiento vinculado correctamente" });
        }}
      />
    </div>
  );
};

export default CreateInvoice;
