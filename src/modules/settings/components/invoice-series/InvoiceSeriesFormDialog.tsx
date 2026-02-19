import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { InvoiceSerie, InvoiceSerieForm } from "../../hooks/useInvoiceSeries";
import { emptyForm } from "../../hooks/useInvoiceSeries";

interface InvoiceSeriesFormDialogProps {
  open: boolean;
  item: InvoiceSerie | null;
  saving: boolean;
  accounts: { id: number; name: string }[];
  providers: { id: number; url: string; branch_id: number; description: string | null }[];
  onSaved: (form: InvoiceSerieForm) => void;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceSeriesFormDialog = ({
  open,
  item,
  saving,
  accounts,
  providers,
  onSaved,
  onOpenChange,
}: InvoiceSeriesFormDialogProps) => {
  const [form, setForm] = useState<InvoiceSerieForm>(emptyForm);

  useEffect(() => {
    if (item) {
      setForm({
        account_id: item.account_id.toString(),
        invoice_provider_id: item.invoice_provider_id.toString(),
        fac_serie: item.fac_serie,
        bol_serie: item.bol_serie,
        ncf_serie: item.ncf_serie,
        ncb_serie: item.ncb_serie,
        ndf_serie: item.ndf_serie,
        ndb_serie: item.ndb_serie,
        grr_serie: item.grr_serie,
        grt_serie: item.grt_serie,
        next_number: item.next_number,
        is_active: item.is_active,
        default: item.default,
      });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved(form);
  };

  const updateField = (field: keyof InvoiceSerieForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Serie" : "Nueva Serie"}
          </DialogTitle>
        </DialogHeader>
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
              onChange={(e) => updateField("next_number", parseInt(e.target.value) || 1)}
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {item ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
