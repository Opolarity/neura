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

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountAccessDialogProps {
  /** Cliente cuyo acceso se gestiona; null cierra el diálogo. */
  account: { id: number; fullName: string } | null;
  onClose: () => void;
}

// Acceso a la cuenta del ecommerce de un cliente: mandar el enlace para
// restablecer la contraseña, cambiar el correo o poner una contraseña nueva.
// Toda la validación real la hace customer-account-access.
export const AccountAccessDialog = ({ account, onClose }: AccountAccessDialogProps) => {
  const { info, busy, sendReset, changeEmail, setPassword } = useAccountAccess(account?.id ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    setNewEmail("");
    setPasswordValue("");
    setConfirm("");
  }, [account?.id]);

  const loading = busy === "load";
  const canEdit = info?.canEditCredentials === true;
  const emailValid = EMAIL_RE.test(newEmail.trim());
  const passwordError =
    password && password.length < MIN_PASSWORD
      ? `Mínimo ${MIN_PASSWORD} caracteres.`
      : confirm && password !== confirm
        ? "Las contraseñas no coinciden."
        : null;
  const passwordReady = password.length >= MIN_PASSWORD && password === confirm;

  const handleChangeEmail = async () => {
    if (await changeEmail(newEmail)) setNewEmail("");
  };

  const handleSetPassword = async () => {
    if (await setPassword(password)) {
      setPasswordValue("");
      setConfirm("");
    }
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

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="account-access-password">Poner contraseña nueva</Label>
                  <Input
                    id="account-access-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                    value={password}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    disabled={busy !== null}
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={busy !== null}
                  />
                  {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                  <Button
                    type="button"
                    className="w-full"
                    disabled={busy !== null || !passwordReady}
                    onClick={handleSetPassword}
                  >
                    {busy === "password" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar contraseña
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
