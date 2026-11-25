import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/shared/hooks/use-toast";
import { useKioskLink } from "../../hooks/useAttendanceConfig";
import { kioskUrl } from "../../utils/format";

/**
 * El link del kiosco de la empresa, para compartir: se abre en una tablet o
 * celular sin iniciar sesión y ese equipo queda activado (se ve en la lista de
 * equipos y se puede desactivar). El lugar lo sigue decidiendo el GPS.
 */
export const KioskLinkPanel = ({ enabled }: { enabled: boolean }) => {
  const k = useKioskLink(enabled);
  const [qr, setQr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const url = k.link ? kioskUrl(k.link.token) : "";

  useEffect(() => {
    if (!url) return;
    let vigente = true;
    void QRCode.toDataURL(url, { margin: 1, width: 176 }).then((d) => vigente && setQr(d));
    return () => {
      vigente = false;
    };
  }, [url]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado" });
    } catch {
      toast({ title: "No se pudo copiar: selecciona el link y cópialo", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start">
      <div className="flex h-[176px] w-[176px] shrink-0 items-center justify-center rounded-md border bg-background">
        {k.loading || !qr ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <img src={qr} alt="Código QR del link del kiosco" width={176} height={176} />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="kiosk-link">Link del kiosco</Label>
        <div className="flex gap-2">
          <Input id="kiosk-link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" className="gap-2" disabled={!url} onClick={() => void copiar()}>
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ábrelo en la tablet o celular que quedará de kiosco: no pide iniciar sesión. Solo marca si el equipo está en
          el radio de un punto de marcación, con DNI y foto (y PIN, si la persona tiene).
        </p>
        <Button variant="ghost" size="sm" className="gap-2" disabled={!url || k.saving} onClick={() => setConfirm(true)}>
          <RefreshCw className="w-4 h-4" />
          Generar nuevo link
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Generar un link nuevo?</AlertDialogTitle>
            <AlertDialogDescription>
              El link actual deja de activar equipos. Los equipos ya activados siguen marcando hasta que los desactives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={k.saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={k.saving} onClick={() => void k.regenerate().then(() => setConfirm(false))}>
              Generar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
