import { Button } from "@/components/ui/button";
import CMovementTypeModal from "../components/create-movements/CMovementTypeModal";
import CMovementForm from "../components/create-movements/CMovementForm";

const CreateMovement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Crear Movimiento
        </h1>
        <div className="flex gap-3">
          <Button variant="outline">Cancelar</Button>
          <Button type="submit" form="movement-form">
            Crear
          </Button>
        </div>
      </div>

      <CMovementForm />

      <CMovementTypeModal />
    </div>
  );
};

export default CreateMovement;
