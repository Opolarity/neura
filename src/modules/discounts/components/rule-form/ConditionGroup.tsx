import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConditionGroup as ConditionGroupType, Condition } from "../../types/priceRule.types";
import { ConditionRow } from "./ConditionRow";

interface ConditionGroupProps {
  group: ConditionGroupType;
  groupIndex: number;
  canRemove: boolean;
  onUpdateOperator: (operator: "AND" | "OR") => void;
  onAddCondition: (condition: Condition) => void;
  onUpdateCondition: (conditionIndex: number, condition: Condition) => void;
  onRemoveCondition: (conditionIndex: number) => void;
  onRemoveGroup: () => void;
}

export const ConditionGroup = ({
  group,
  groupIndex,
  canRemove,
  onUpdateOperator,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onRemoveGroup,
}: ConditionGroupProps) => {
  const handleAddCondition = () => {
    onAddCondition({ type: "cart_subtotal", operator: "gte", value: 0 } as Condition);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Grupo {groupIndex + 1}</span>
          <div className="flex gap-1">
            <Badge
              variant={group.operator === "AND" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onUpdateOperator("AND")}
            >
              AND
            </Badge>
            <Badge
              variant={group.operator === "OR" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onUpdateOperator("OR")}
            >
              OR
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {group.operator === "AND"
              ? "(todas deben cumplirse)"
              : "(al menos una debe cumplirse)"}
          </span>
        </div>
        {canRemove && (
          <Button variant="ghost" size="icon" onClick={onRemoveGroup}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {group.conditions.map((condition, condIdx) => (
          <div key={condIdx}>
            {condIdx > 0 && (
              <div className="flex justify-center py-1">
                <Badge variant="secondary" className="text-xs">
                  {group.operator}
                </Badge>
              </div>
            )}
            <ConditionRow
              condition={condition}
              onChange={(c) => onUpdateCondition(condIdx, c)}
              onRemove={() => onRemoveCondition(condIdx)}
            />
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={handleAddCondition}>
        <Plus className="w-3 h-3 mr-1" />
        Agregar Condición
      </Button>
    </div>
  );
};
