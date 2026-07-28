import { useEffect, useRef, useState } from "react";
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
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import { Loader2, Paperclip, X, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";
import { useSupportRequest } from "../hooks/useSupportRequest";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  type SupportRequestType,
} from "../types/Support.types";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingFile {
  file: File;
}

const isHtmlEmpty = (html: string) =>
  !html || (html.replace(/<[^>]*>/g, "").trim() === "" && !html.includes("<img"));

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Quitar el prefijo data URI: la API acepta base64 puro
      resolve(result.substring(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}"`));
    reader.readAsDataURL(file);
  });

export const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const { user, appUser } = useAuth();
  const { sending, submit } = useSupportRequest();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [requestType, setRequestType] = useState<SupportRequestType>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

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
      setPendingFiles([]);
    }
  }, [open]);

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const next = [...pendingFiles];

    for (const file of incoming) {
      if (next.length >= MAX_ATTACHMENTS) {
        toast.error(`Máximo ${MAX_ATTACHMENTS} archivos por solicitud`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`"${file.name}" supera el límite de 5 MB`);
        continue;
      }
      next.push({ file });
    }
    setPendingFiles(next);
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Ingresa un título para tu solicitud");
      return;
    }

    try {
      const attachments = await Promise.all(
        pendingFiles.map(async ({ file }) => ({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          contentBase64: await readFileAsBase64(file),
        })),
      );

      await submit({
        title: title.trim(),
        description: isHtmlEmpty(description) ? undefined : description,
        requestType,
        reporterName,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success("Solicitud enviada al equipo de soporte");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo enviar la solicitud de soporte");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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

          <WysiwygEditor
            label="Descripción"
            value={description}
            onChange={setDescription}
            placeholder="Cuéntanos qué pasó o qué te gustaría mejorar..."
            height="140px"
            toolbar="basic"
            allowImages
          />

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label>Archivos adjuntos</Label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || pendingFiles.length >= MAX_ATTACHMENTS}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Adjuntar archivos
            </Button>
            <p className="text-xs text-muted-foreground">
              Hasta {MAX_ATTACHMENTS} archivos de 5 MB cada uno (capturas, PDFs...)
            </p>

            {pendingFiles.length > 0 && (
              <ul className="space-y-1 mt-2">
                {pendingFiles.map(({ file }, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-2 py-1.5"
                  >
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={sending}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Quitar ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
