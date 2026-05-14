import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: number;
  name: string;
  address: string;
  ubigeo: string | null;
}

export interface GuiaRemisionData {
  // Traslado
  motivo_traslado: string;
  peso_bruto_total: number;
  peso_unidad: string;
  numero_bultos: number;
  tipo_transporte: string;
  fecha_traslado: string;
  // Partida
  partida_ubigeo: string;
  partida_direccion: string;
  // Llegada
  llegada_ubigeo: string;
  llegada_direccion: string;
  // Transporte público
  transportista_ruc?: string;
  transportista_nombre?: string;
  // Transporte privado
  conductor_dni?: string;
  conductor_nombre?: string;
  conductor_apellidos?: string;
  conductor_licencia?: string;
  // Vehículo
  placa: string;
}

interface GuiaRemisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  onConfirm: (data: GuiaRemisionData) => Promise<void>;
}

const MOTIVOS = [
  { value: "01", label: "01 — Venta" },
  { value: "02", label: "02 — Compra" },
  { value: "04", label: "04 — Traslado entre establecimientos" },
  { value: "08", label: "08 — Importación" },
  { value: "09", label: "09 — Exportación" },
  { value: "13", label: "13 — Otros" },
  { value: "14", label: "14 — Venta sujeta a confirmación" },
  { value: "17", label: "17 — Traslado para transformación" },
  { value: "18", label: "18 — Traslado emisor itinerante" },
];

const todayInputValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const inputDateToNubefact = (val: string) => {
  // Convierte YYYY-MM-DD → DD-MM-YYYY
  const [y, m, dd] = val.split("-");
  return `${dd}-${m}-${y}`;
};

export default function GuiaRemisionModal({
  open,
  onOpenChange,
  orderId,
  onConfirm,
}: GuiaRemisionModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [motivoTraslado, setMotivoTraslado] = useState("01");
  const [fechaTraslado, setFechaTraslado] = useState(todayInputValue());
  const [pesoBruto, setPesoBruto] = useState("");
  const [numeroBultos, setNumeroBultos] = useState("");
  const [tipoTransporte, setTipoTransporte] = useState("01");

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [partidaUbigeo, setPartidaUbigeo] = useState("");
  const [partidaDireccion, setPartidaDireccion] = useState("");

  const [llegadaUbigeo, setLlegadaUbigeo] = useState("");
  const [llegadaDireccion, setLlegadaDireccion] = useState("");

  const [placa, setPlaca] = useState("");
  const [transportistaRuc, setTransportistaRuc] = useState("");
  const [transportistaNombre, setTransportistaNombre] = useState("");
  const [conductorDni, setConductorDni] = useState("");
  const [conductorNombre, setConductorNombre] = useState("");
  const [conductorApellidos, setConductorApellidos] = useState("");
  const [conductorLicencia, setConductorLicencia] = useState("");

  useEffect(() => {
    if (!open) return;
    fetchOrderAndBranches();
  }, [open, orderId]);

  const fetchOrderAndBranches = async () => {
    // Obtener datos del pedido para pre-llenar dirección de llegada y branch
    const [orderRes, branchesRes] = await Promise.all([
      supabase.from("orders").select("address, branch_id").eq("id", orderId).single(),
      supabase.from("branches").select("id, name, address, ubigeo").eq("is_active", true).order("name"),
    ]);

    if (orderRes.data?.address) {
      setLlegadaDireccion(orderRes.data.address);
    }

    if (branchesRes.data) {
      setBranches(branchesRes.data as Branch[]);
      const orderBranchId = orderRes.data?.branch_id;
      const defaultBranch = orderBranchId
        ? branchesRes.data.find((b) => b.id === orderBranchId)
        : branchesRes.data[0];
      if (defaultBranch) {
        setSelectedBranchId(String(defaultBranch.id));
        setPartidaDireccion(defaultBranch.address || "");
        setPartidaUbigeo(defaultBranch.ubigeo || "");
      }
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    const branch = branches.find((b) => String(b.id) === branchId);
    if (branch) {
      setPartidaDireccion(branch.address || "");
      setPartidaUbigeo(branch.ubigeo || "");
    }
  };

  const validate = (): string | null => {
    if (!motivoTraslado) return "Selecciona el motivo de traslado";
    if (!fechaTraslado) return "Ingresa la fecha de inicio de traslado";
    if (!pesoBruto || Number(pesoBruto) <= 0) return "El peso bruto debe ser mayor a 0";
    if (!numeroBultos || Number(numeroBultos) < 1) return "El número de bultos debe ser al menos 1";
    if (!partidaUbigeo.trim()) return "Ingresa el ubigeo de punto de partida";
    if (!partidaDireccion.trim()) return "Ingresa la dirección de punto de partida";
    if (!llegadaUbigeo.trim()) return "Ingresa el ubigeo de punto de llegada";
    if (!llegadaDireccion.trim()) return "Ingresa la dirección de punto de llegada";
    if (!placa.trim()) return "Ingresa la placa del vehículo";

    if (tipoTransporte === "01") {
      if (!transportistaRuc.trim()) return "Ingresa el RUC del transportista";
      if (!transportistaNombre.trim()) return "Ingresa el nombre del transportista";
    } else {
      if (!conductorDni.trim()) return "Ingresa el DNI del conductor";
      if (!conductorNombre.trim()) return "Ingresa el nombre del conductor";
      if (!conductorApellidos.trim()) return "Ingresa los apellidos del conductor";
      if (!conductorLicencia.trim()) return "Ingresa el número de licencia del conductor";
    }

    return null;
  };

  const handleConfirm = async () => {
    const error = validate();
    if (error) {
      toast({ title: "Datos incompletos", description: error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const data: GuiaRemisionData = {
        motivo_traslado: motivoTraslado,
        peso_bruto_total: Number(pesoBruto),
        peso_unidad: "KGM",
        numero_bultos: Number(numeroBultos),
        tipo_transporte: tipoTransporte,
        fecha_traslado: inputDateToNubefact(fechaTraslado),
        partida_ubigeo: partidaUbigeo.trim(),
        partida_direccion: partidaDireccion.trim(),
        llegada_ubigeo: llegadaUbigeo.trim(),
        llegada_direccion: llegadaDireccion.trim(),
        placa: placa.trim().toUpperCase(),
        ...(tipoTransporte === "01"
          ? {
              transportista_ruc: transportistaRuc.trim(),
              transportista_nombre: transportistaNombre.trim(),
            }
          : {
              conductor_dni: conductorDni.trim(),
              conductor_nombre: conductorNombre.trim(),
              conductor_apellidos: conductorApellidos.trim(),
              conductor_licencia: conductorLicencia.trim(),
            }),
      };

      await onConfirm(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Datos de Guía de Remisión</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Sección A — Traslado */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Traslado</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Motivo de traslado</Label>
                <Select value={motivoTraslado} onValueChange={setMotivoTraslado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Fecha inicio traslado</Label>
                <Input
                  type="date"
                  value={fechaTraslado}
                  onChange={(e) => setFechaTraslado(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Peso bruto total (kg)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej: 5.00"
                  value={pesoBruto}
                  onChange={(e) => setPesoBruto(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>N° de bultos</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 1"
                  value={numeroBultos}
                  onChange={(e) => setNumeroBultos(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de transporte</Label>
              <RadioGroup
                value={tipoTransporte}
                onValueChange={setTipoTransporte}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="01" id="tp-publico" />
                  <Label htmlFor="tp-publico" className="cursor-pointer">Público</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="02" id="tp-privado" />
                  <Label htmlFor="tp-privado" className="cursor-pointer">Privado</Label>
                </div>
              </RadioGroup>
            </div>
          </section>

          {/* Sección B — Punto de partida */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Punto de Partida</h3>

            <div className="space-y-1">
              <Label>Sucursal</Label>
              <Select value={selectedBranchId} onValueChange={handleBranchChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ubigeo de partida <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ej: 150101"
                  value={partidaUbigeo}
                  onChange={(e) => setPartidaUbigeo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Dirección de partida</Label>
                <Input
                  value={partidaDireccion}
                  onChange={(e) => setPartidaDireccion(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Sección C — Punto de llegada */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Punto de Llegada</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ubigeo de llegada <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ej: 211101"
                  value={llegadaUbigeo}
                  onChange={(e) => setLlegadaUbigeo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Dirección de llegada</Label>
                <Input
                  value={llegadaDireccion}
                  onChange={(e) => setLlegadaDireccion(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Sección D — Transporte */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {tipoTransporte === "01" ? "Datos del Transportista" : "Datos del Conductor"}
            </h3>

            <div className="space-y-1">
              <Label>Placa del vehículo <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: ABC444"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            {tipoTransporte === "01" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>RUC del transportista <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="20xxxxxxxxx"
                    value={transportistaRuc}
                    onChange={(e) => setTransportistaRuc(e.target.value)}
                    maxLength={11}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nombre / Razón social <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Empresa de transporte SAC"
                    value={transportistaNombre}
                    onChange={(e) => setTransportistaNombre(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>DNI del conductor <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="12345678"
                    value={conductorDni}
                    onChange={(e) => setConductorDni(e.target.value)}
                    maxLength={8}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nombre <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Juan"
                    value={conductorNombre}
                    onChange={(e) => setConductorNombre(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Apellidos <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Pérez López"
                    value={conductorApellidos}
                    onChange={(e) => setConductorApellidos(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>N° de licencia <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Q12345678"
                    value={conductorLicencia}
                    onChange={(e) => setConductorLicencia(e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear guía
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
