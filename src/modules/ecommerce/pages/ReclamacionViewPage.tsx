import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getReclamacionById,
  ReclamacionDetalle,
} from "../services/reclamaciones.service";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
);

const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    amount,
  );

const formatBoolean = (value?: boolean | string) => {
  if (value === true || value === "true") return "Sí";
  if (value === false || value === "false") return "No";
  return "-";
};

const renderClaimType = (claimType: string | null | undefined) => {
  if (!claimType) return <Badge variant="destructive">Reclamo</Badge>;
  const normalized = claimType.toLowerCase();
  return (
    <Badge variant={normalized === "reclamo" ? "destructive" : "outline"}>
      {claimType.charAt(0).toUpperCase() + claimType.slice(1).toLowerCase()}
    </Badge>
  );
};

const renderDetailBadge = (detail?: string | null) => {
  const value = detail?.trim() || "";
  const normalized = value.toLowerCase();
  if (normalized === "queja") {
    return <Badge variant="outline">Queja</Badge>;
  }

  if (
    normalized === "reclamacion" ||
    normalized === "reclamación" ||
    normalized === "reclamo"
  ) {
    return <Badge variant="destructive">Reclamo</Badge>;
  }

  return "-";
};

export default function ReclamacionViewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [reclamacion, setReclamacion] = useState<ReclamacionDetalle | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const claimId = Number(id);
    if (Number.isNaN(claimId)) {
      toast({
        title: "ID inválido",
        description: "El id de reclamación no es válido.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    getReclamacionById(claimId)
      .then(setReclamacion)
      .catch((error) => {
        toast({
          title: "Error al cargar reclamación",
          description: error?.message ?? "No se pudo obtener la reclamación.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando reclamación...</p>
      </div>
    );
  }

  if (!reclamacion) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No se encontró la reclamación solicitada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/ecommerce/reclamaciones")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reclamación</h1>
          <p className="text-gray-600">Detalle completo de la reclamación</p>
        </div>
        <div className="ml-auto">
          {renderClaimType(reclamacion.claim_type || reclamacion.detail)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Reclamante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <Field
              label="Nombres"
              value={
                reclamacion.requester_name ||
                reclamacion.representative_name ||
                "-"
              }
            />
            <Field
              label="Apellido Paterno"
              value={reclamacion.requester_last_name || "-"}
            />
            <Field
              label="Apellido Materno"
              value={reclamacion.requester_last_name2 || "-"}
            />
            <Field label="Correo" value={reclamacion.email || "-"} />
            <Field
              label="Teléfono"
              value={reclamacion.requester_phone || "-"}
            />
            <Field
              label="Tipo de Documento"
              value={
                (reclamacion.requester_document_type ||
                  reclamacion.representative_document_type ||
                  reclamacion.requester_document_type_id) ??
                reclamacion.representative_document_type_id ??
                "-"
              }
            />
            <Field
              label="Número de Documento"
              value={reclamacion.requester_document_number || "-"}
            />
            <Field
              label="País"
              value={
                ((reclamacion.requester_country ||
                  reclamacion.requester_country_id) ??
                  reclamacion.representative_country) ||
                "-"
              }
            />
            <Field
              label="Departamento"
              value={reclamacion.requester_department || "-"}
            />
            <Field
              label="Estado"
              value={
                (reclamacion.requester_state ||
                  reclamacion.requester_state_id) ??
                "-"
              }
            />
            <Field
              label="Ciudad"
              value={
                ((reclamacion.requester_city ||
                  reclamacion.requester_city_id) ??
                  reclamacion.representative_city) ||
                "-"
              }
            />
            <Field
              label="Distrito"
              value={reclamacion.requester_district || "-"}
            />
            <Field
              label="Vecindario"
              value={reclamacion.requester_neighborhood_id ?? "-"}
            />
            <Field
              label="Dirección"
              value={
                reclamacion.requester_address ||
                reclamacion.representative_address ||
                "-"
              }
            />
            <Field
              label="Edad"
              value={formatBoolean(reclamacion.requester_age)}
            />
            <Field label="Producto" value={reclamacion.good || "-"} />
            <Field
              label="Aceptó términos"
              value={formatBoolean(reclamacion.terms)}
            />
            <Field
              label="Apoderado"
              value={reclamacion.representative_name || "-"}
            />
            <Field
              label="Email apoderado"
              value={reclamacion.representative_email || "-"}
            />
            <Field
              label="Teléfono apoderado"
              value={reclamacion.representative_phone || "-"}
            />
            <Field
              label="Tipo documento apoderado"
              value={reclamacion.representative_document_type || "-"}
            />
            <Field
              label="Número documento apoderado"
              value={reclamacion.representative_document_number || "-"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Reclamación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Field
            label="Orden"
            value={
              reclamacion.order_id
                ? `#${reclamacion.order_id}`
                : `Reclamo #${reclamacion.id}`
            }
          />
          <Field label="Correo" value={reclamacion.email} />
          <Field
            label="Fecha de Incidente"
            value={formatDate(reclamacion.incident_date)}
          />
          <Field
            label="Monto a reclamar (en soles)"
            value={formatCurrency(reclamacion.amount_claim)}
          />
          <Field
            label="Detalle"
            value={renderDetailBadge(reclamacion.detail)}
          />
          <Field
            label="Tipo de reclamo"
            value={renderClaimType(reclamacion.claim_type)}
          />
          <Field
            label="Creado"
            value={
              reclamacion.created_at ? formatDate(reclamacion.created_at) : "-"
            }
          />
          <div className="space-y-4 sm:col-span-2 md:col-span-3">
            <p className="text-sm text-muted-foreground">
              Descripción de reclamo
            </p>
            <p className="whitespace-pre-line font-medium">
              {reclamacion.complaint_description || "-"}
            </p>
            <p className="text-sm text-muted-foreground">Detalle</p>
            <p className="whitespace-pre-line font-medium">
              {reclamacion.detail || "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              Pedido del reclamante
            </p>
            <p className="whitespace-pre-line font-medium">
              {reclamacion.claimant_request || "-"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
