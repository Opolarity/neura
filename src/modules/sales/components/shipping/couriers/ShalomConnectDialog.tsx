import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShalomConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (username: string, password: string) => Promise<unknown>;
  isConnecting: boolean;
}

export function ShalomConnectDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ShalomConnectDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const close = (next: boolean) => {
    if (!next) {
      setPassword("");
      setShowErrors(false);
    }
    onOpenChange(next);
  };

  const handleConnect = async () => {
    setShowErrors(true);
    if (!username.trim() || !password) return;
    await onConnect(username, password);
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar cuenta Shalom Pro</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shalom-user" required>
              Usuario o correo de Shalom Pro
            </Label>
            <Input
              id="shalom-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ventas@tutienda.pe"
              autoComplete="off"
              aria-required
              className={showErrors && !username.trim() ? "border-destructive" : undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="shalom-password" required>
              Contraseña
            </Label>
            <Input
              id="shalom-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-required
              className={showErrors && !password ? "border-destructive" : undefined}
            />
          </div>
          <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Se usa una sola vez para abrir la sesión. Neura no guarda la contraseña,
            solo el identificador de la conexión.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
