import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { PageLoader } from "@/shared/components/page-loader";
import { ComponentPermission } from "@/shared/components/component-permission";
import { formatDateDisplay, formatDateTime } from "@/shared/utils/date";
import { useReclamacionDetalle } from "../hooks/useReclamacionDetalle";
import ComplaintNotes from "../components/reclamaciones/ComplaintNotes";
import ComplaintReplyDialog from "../components/reclamaciones/ComplaintReplyDialog";
import {
  ComplaintStatusBadge,
  ComplaintTypeBadge,
} from "../components/reclamaciones/ComplaintBadges";
import {
  COMPLAINT_STATUS_LABEL,
  type ComplaintStatus,
} from "../types/reclamaciones.types";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="font-medium break-words">{value || "-"}</div>
  </div>
);

const LongField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="whitespace-pre-line font-medium">{value || "-"}</p>
  </div>
);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);

const yesNo = (value: boolean) => (value ? "Sí" : "No");

export default function ReclamacionViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const claimId = Number(id);
  const isValidId = Number.isInteger(claimId) && claimId > 0;

  const {
    reclamacion,
    notes,
    loading,
    loadingNotes,
    savingNote,
    savingStatus,
    addNote,
    changeStatus,
    refreshNotes,
  } = useReclamacionDetalle(isValidId ? claimId : null);

  const [replyOpen, setReplyOpen] = useState(false);

  if (loading) {
    return <PageLoader message="Cargando reclamación..." />;
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

  // El apoderado solo aplica a menores de edad; mostrar la tarjeta siempre
  // llenaba media pantalla de guiones.
  const showRepresentative =
    !reclamacion.isAdult ||
    Boolean(reclamacion.representativeName || reclamacion.representativeDocumentNumber);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/ecommerce/reclamaciones")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-2xl font-bold text-foreground">
          Reclamo #{reclamacion.id}
        </h1>

        <ComplaintTypeBadge claimType={reclamacion.claimType} />
        <ComplaintStatusBadge status={reclamacion.status} />

        <div className="ml-auto">
          <ComponentPermission codeIn={["ecommerce_claims.send"]}>
            <Button onClick={() => setReplyOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Responder al reclamante
            </Button>
          </ComponentPermission>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Columna principal: quién reclama y qué reclama */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Datos del reclamante</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <Field label="Nombres" value={reclamacion.fullName} />
              <Field label="Tipo de documento" value={reclamacion.documentTypeName} />
              <Field label="N° de documento" value={reclamacion.documentNumber} />
              <Field label="Correo" value={reclamacion.email} />
              <Field label="Teléfono" value={reclamacion.phone} />
              <Field label="Mayor de edad" value={yesNo(reclamacion.isAdult)} />
              <Field label="País" value={reclamacion.countryName} />
              <Field label="Departamento" value={reclamacion.stateName} />
              <Field label="Ciudad" value={reclamacion.cityName} />
              <Field label="Distrito" value={reclamacion.neighborhoodName} />
              <div className="sm:col-span-2 md:col-span-3">
                <Field label="Dirección" value={reclamacion.address} />
              </div>
            </CardContent>
          </Card>

          {showRepresentative && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Datos del apoderado</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <Field label="Nombres y apellidos" value={reclamacion.representativeName} />
                <Field
                  label="Tipo de documento"
                  value={reclamacion.representativeDocumentTypeName}
                />
                <Field
                  label="N° de documento"
                  value={reclamacion.representativeDocumentNumber}
                />
                <Field label="Correo" value={reclamacion.representativeEmail} />
                <Field label="Teléfono" value={reclamacion.representativePhone} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detalle del reclamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <Field
                  label="Orden asociada"
                  value={reclamacion.orderId ? `#${reclamacion.orderId}` : "-"}
                />
                <Field label="Bien contratado" value={reclamacion.good} />
                <Field
                  label="Fecha del incidente"
                  value={
                    reclamacion.incidentDate
                      ? formatDateDisplay(reclamacion.incidentDate)
                      : "-"
                  }
                />
                <Field
                  label="Monto reclamado"
                  value={formatCurrency(reclamacion.amountClaim)}
                />
                <Field
                  label="Tipo"
                  value={<ComplaintTypeBadge claimType={reclamacion.claimType} />}
                />
                <Field label="Aceptó términos" value={yesNo(reclamacion.terms)} />
              </div>

              <Separator />

              <div className="space-y-6">
                <LongField
                  label="Descripción del reclamo"
                  value={reclamacion.claimDescription}
                />
                <LongField label="Detalle" value={reclamacion.detail} />
                <LongField
                  label="Pedido del reclamante"
                  value={reclamacion.complainingRequest}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral: en qué punto está y qué se ha hecho */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ComponentPermission codeIn={["ecommerce_claims.edit"]}>
                <Select
                  value={reclamacion.status}
                  onValueChange={(value) => changeStatus(value as ComplaintStatus)}
                  disabled={savingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMPLAINT_STATUS_LABEL) as ComplaintStatus[]).map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {COMPLAINT_STATUS_LABEL[value]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </ComponentPermission>

              <Field
                label="Fecha de registro"
                value={
                  reclamacion.createdAt ? formatDateTime(reclamacion.createdAt) : "-"
                }
              />
              <Field
                label="Fecha de respuesta"
                value={
                  reclamacion.answeredAt ? formatDateTime(reclamacion.answeredAt) : "-"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Notas internas</CardTitle>
                {/* Refresca solo el hilo: otra persona puede haber dejado una
                    nota mientras esta pantalla estaba abierta. */}
                <Button
                  variant="ghost"
                  size="sm"
                  title="Actualizar notas"
                  onClick={refreshNotes}
                  disabled={loadingNotes}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingNotes ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ComplaintNotes
                notes={notes}
                saving={savingNote}
                loading={loadingNotes}
                onAddNote={(message) => addNote(message, false)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ComplaintReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        complaintId={reclamacion.id}
        customerEmail={reclamacion.email}
        saving={savingNote}
        onSend={(message) => addNote(message, true)}
      />
    </div>
  );
}
