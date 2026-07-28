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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";
import { useSupportRequest } from "../hooks/useSupportRequest";
import type { SupportRequestType } from "../types/Support.types";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const { user, appUser } = useAuth();
  const { sending, submit } = useSupportRequest();

  const [requestType, setRequestType] = useState<SupportRequestType>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reporterName =
    (appUser?.accountName && appUser.accountName !== "Sin Cuenta"
      ? appUser.accountName
      : null) ??
    user?.email ??
    "Usuario ERP";

  // Reset on close
  useEffect(() => {
    if (!open) {
      setRequestType("suggestion");
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Ingresa un título para tu solicitud");
      return;
    }

    try {
      await submit({
        title: title.trim(),
        description: description.trim() || undefined,
        requestType,
        reporterName,
      });
      toast.success("Solicitud enviada al equipo de soporte");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo enviar la solicitud de soporte");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitud de soporte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tipo de solicitud</Label>
            <Select
              value={requestType}
              onValueChange={(value) => setRequestType(value as SupportRequestType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticket">Problema (ticket)</SelectItem>
                <SelectItem value="suggestion">Sugerencia (mejora)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="support-title">Título *</Label>
            <Input
              id="support-title"
              placeholder="Ej: No carga el reporte de ventas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="support-description">Descripción</Label>
            <Textarea
              id="support-description"
              placeholder="Cuéntanos qué pasó o qué te gustaría mejorar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Se enviará a nombre de: <span className="font-medium">{reporterName}</span>
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={sending}>
            {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
