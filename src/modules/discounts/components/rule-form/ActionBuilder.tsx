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

      {actions.length === 0 ? (
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Elegir descuento
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-3 h-3 mr-1" />
          Agregar otro descuento
        </Button>
      )}
    </div>
  );
};
