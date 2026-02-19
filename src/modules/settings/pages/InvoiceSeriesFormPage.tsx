import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoiceSeriesForm } from "../hooks/useInvoiceSeriesForm";

const InvoiceSeriesFormPage = () => {
  const navigate = useNavigate();
  const {
    form,
    accounts,
    providers,
    invoiceTypes,
    loading,
    saving,
    isEditing,
    updateField,
    saveSerie,
  } = useInvoiceSeriesForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSerie();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/invoices/series")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Editar Serie" : "Nueva Serie"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? "Modifica los datos de la serie de facturación"
              : "Configura una nueva serie de comprobantes electrónicos"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Serie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cuenta</Label>
                <Select
                  value={form.account_id}
                  onValueChange={(v) => updateField("account_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proveedor de facturación</Label>
                <Select
                  value={form.invoice_provider_id}
                  onValueChange={(v) => updateField("invoice_provider_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.description || `Proveedor #${p.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Comprobante</Label>
                <Select
                  value={form.invoice_type_id}
                  onValueChange={(v) => updateField("invoice_type_id", v)}
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
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input
                  value={form.serie}
                  onChange={(e) => updateField("serie", e.target.value)}
                  placeholder="Ej: FW01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Siguiente número</Label>
              <Input
                type="number"
                min={1}
                value={form.next_number}
                onChange={(e) =>
                  updateField("next_number", parseInt(e.target.value) || 1)
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => updateField("is_active", v)}
              />
              <Label>Activo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/invoices/series")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSeriesFormPage;
