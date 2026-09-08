import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface ComplaintReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: number;
  customerEmail: string;
  saving: boolean;
  onSend: (message: string) => Promise<boolean>;
}

/**
 * Respuesta al reclamante.
 *
 * Lo que se escriba aquí sale por correo a su dirección y queda en el hilo de
 * notas marcado como respuesta; el reclamo pasa a "Respondido". Por eso el
 * correo destino se muestra en el diálogo: es una acción que sale del ERP hacia
 * afuera y no se puede deshacer.
 */
const ComplaintReplyDialog = ({
  open,
  onOpenChange,
  complaintId,
  customerEmail,
  saving,
  onSend,
}: ComplaintReplyDialogProps) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const ok = await onSend(trimmed);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Responder al reclamante</DialogTitle>
          <DialogDescription>
            Se enviará por correo a {customerEmail} y quedará registrado en el
            reclamo #{complaintId}, que pasará a estado Respondido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="complaint-reply">Mensaje</Label>
          <Textarea
            id="complaint-reply"
            rows={7}
            placeholder="Escribe la respuesta que recibirá el reclamante..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={saving || message.trim().length === 0}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar respuesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintReplyDialog;
