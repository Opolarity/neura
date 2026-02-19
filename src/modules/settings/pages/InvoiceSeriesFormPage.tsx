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

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Serie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label>Serie Factura (FAC)</Label>
                <Input
                  value={form.fac_serie}
                  onChange={(e) => updateField("fac_serie", e.target.value)}
                  placeholder="Ej: FPP1"
                />
              </div>
              <div className="space-y-2">
                <Label>Serie Boleta (BOL)</Label>
                <Input
                  value={form.bol_serie}
                  onChange={(e) => updateField("bol_serie", e.target.value)}
                  placeholder="Ej: BPP1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nota Crédito Factura (NCF)</Label>
                <Input
                  value={form.ncf_serie}
                  onChange={(e) => updateField("ncf_serie", e.target.value)}
                  placeholder="Ej: FPP1"
                />
              </div>
              <div className="space-y-2">
                <Label>Nota Crédito Boleta (NCB)</Label>
                <Input
                  value={form.ncb_serie}
                  onChange={(e) => updateField("ncb_serie", e.target.value)}
                  placeholder="Ej: BPP1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nota Débito Factura (NDF)</Label>
                <Input
                  value={form.ndf_serie}
                  onChange={(e) => updateField("ndf_serie", e.target.value)}
                  placeholder="Ej: FPP1"
                />
              </div>
              <div className="space-y-2">
                <Label>Nota Débito Boleta (NDB)</Label>
                <Input
                  value={form.ndb_serie}
                  onChange={(e) => updateField("ndb_serie", e.target.value)}
                  placeholder="Ej: BPP1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guía Remisión Remitente (GRR)</Label>
                <Input
                  value={form.grr_serie}
                  onChange={(e) => updateField("grr_serie", e.target.value)}
                  placeholder="Ej: TPP1"
                />
              </div>
              <div className="space-y-2">
                <Label>Guía Remisión Transportista (GRT)</Label>
                <Input
                  value={form.grt_serie}
                  onChange={(e) => updateField("grt_serie", e.target.value)}
                  placeholder="Ej: VPP1"
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

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => updateField("is_active", v)}
                />
                <Label>Activo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.default}
                  onCheckedChange={(v) => updateField("default", v)}
                />
                <Label>Por defecto</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSeriesFormPage;
