import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ListFilter } from "lucide-react";

interface InvoicesFilterModalProps {
  filters?: null;
}

const InvoicesFilterModal = ({ filters }: InvoicesFilterModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"default"} className="gap-2">
          <ListFilter className="w-4 h-4" />
          Filtrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="is_admin">Tipo de Rol</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                <SelectItem value="true">Administrador</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minuser">Min. Usuarios</Label>
              <Input id="minuser" type="number" placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxuser">Max. Usuarios</Label>
              <Input id="maxuser" type="number" placeholder="100" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline">Limpiar</Button>
          <Button>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicesFilterModal;
