import { useState, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoiceSeriesForm } from "../hooks/useInvoiceSeriesForm";
import { cn } from "@/lib/utils";

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

  const [accountOpen, setAccountOpen] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id.toString() === form.account_id),
    [accounts, form.account_id]
  );

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
                <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedAccount
                        ? `${selectedAccount.document_number} — ${selectedAccount.name}`
                        : "Buscar cuenta..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o documento..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
                        <CommandGroup>
                          {accounts.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={`${a.document_number} ${a.name}`}
                              onSelect={() => {
                                updateField("account_id", a.id.toString());
                                setAccountOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.account_id === a.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {a.document_number} — {a.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
