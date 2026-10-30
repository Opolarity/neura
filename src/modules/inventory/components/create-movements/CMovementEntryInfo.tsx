import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CMovementEntryInfoProps {
  remissionGuideCode: string;
  notes: string;
  onRemissionGuideCodeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

/**
 * Código de guía de remisión y nota de un ingreso. Los dos son opcionales y se
 * guardan en la cabecera del ingreso (stock_entries); se ven en el detalle
 * del movimiento, no en el listado.
 */
const CMovementEntryInfo = ({
  remissionGuideCode,
  notes,
  onRemissionGuideCodeChange,
  onNotesChange,
}: CMovementEntryInfoProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="remission-guide-code">Código de guía de remisión (opcional)</Label>
        <Input
          id="remission-guide-code"
          placeholder="Guía Nº 366"
          maxLength={200}
          value={remissionGuideCode}
          onChange={(e) => onRemissionGuideCodeChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-notes">Nota (opcional)</Label>
        <Textarea
          id="entry-notes"
          placeholder="Ingreso para pedidos"
          rows={2}
          maxLength={1000}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CMovementEntryInfo;
