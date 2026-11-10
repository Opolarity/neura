import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAccountAccess } from "../hooks/useAccountAccess";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountAccessDialogProps {
  /** Cliente cuyo acceso se gestiona; null cierra el diálogo. */
  account: { id: number; fullName: string } | null;
  onClose: () => void;
}

// Acceso a la cuenta del ecommerce de un cliente: mandar el enlace para
// restablecer la contraseña o cambiar el correo. La contraseña no se pone desde
// el ERP: el cliente la crea con el enlace.
// Toda la validación real la hace customer-account-access.
export const AccountAccessDialog = ({ account, onClose }: AccountAccessDialogProps) => {
  const { info, busy, sendReset, changeEmail } = useAccountAccess(account?.id ?? null);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    setNewEmail("");
  }, [account?.id]);

  const loading = busy === "load";
  const canEdit = info?.canEditCredentials === true;
  const emailValid = EMAIL_RE.test(newEmail.trim());

  const handleChangeEmail = async () => {
    if (await changeEmail(newEmail)) setNewEmail("");
  };

  return (
    <Dialog open={account !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acceso a la cuenta</DialogTitle>
          <DialogDescription>{account?.fullName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando cuenta...
          </div>
        ) : !info ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No se pudo cargar la cuenta de este cliente.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <Label>Correo de acceso</Label>
              <p className="font-medium break-all">{info.email || "—"}</p>
              {!canEdit && (
                <p className="text-sm text-muted-foreground">
                  Entra con {info.provider === "google" ? "Google" : info.provider}: el correo y la
                  contraseña se gestionan desde esa cuenta.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Restablecer contraseña</Label>
              <p className="text-sm text-muted-foreground">
                Le llega un correo con un enlace para crear una contraseña nueva.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy !== null || !info.email}
                onClick={sendReset}
              >
                {busy === "reset" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar enlace al correo
              </Button>
            </div>

            {canEdit && (
              <>
                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="account-access-email">Cambiar correo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="account-access-email"
                      type="email"
                      placeholder="nuevo@correo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={busy !== null}
                    />
                    <Button
                      type="button"
                      disabled={busy !== null || !emailValid}
                      onClick={handleChangeEmail}
                    >
                      {busy === "email" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Guardar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
