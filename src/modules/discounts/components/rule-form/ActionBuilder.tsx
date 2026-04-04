import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionConfig } from "../../types/priceRule.types";
import { ActionRow } from "./ActionRow";

interface ActionBuilderProps {
  actions: ActionConfig[];
  addAction: (action: ActionConfig) => void;
  updateAction: (index: number, action: ActionConfig) => void;
  removeAction: (index: number) => void;
}

export const ActionBuilder = ({
  actions,
  addAction,
  updateAction,
  removeAction,
}: ActionBuilderProps) => {
  const handleAdd = () => {
    addAction({ type: "percent_discount_subtotal", value: 0 });
  };

  return (
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <ActionRow
          key={idx}
          action={action}
          onChange={(a) => updateAction(idx, a)}
          onRemove={() => removeAction(idx)}
        />
      ))}

      <Button variant="outline" onClick={handleAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Acción
      </Button>

      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Debe agregar al menos una acción
        </p>
      )}
    </div>
  );
};
