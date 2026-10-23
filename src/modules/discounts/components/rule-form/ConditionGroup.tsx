import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConditionGroup as ConditionGroupType, Condition } from "../../types/priceRule.types";
import { ConditionRow } from "./ConditionRow";
import { OperatorToggle, OPERATOR_CONNECTOR } from "./OperatorToggle";

interface ConditionGroupProps {
  group: ConditionGroupType;
  groupIndex: number;
  // Con un solo grupo no hace falta numerarlo ni mostrarlo como caja aparte:
  // para el usuario es simplemente "la lista de condiciones".
  isOnlyGroup: boolean;
  onUpdateOperator: (operator: "AND" | "OR") => void;
  onAddCondition: (condition: Condition) => void;
  onUpdateCondition: (conditionIndex: number, condition: Condition) => void;
  onRemoveCondition: (conditionIndex: number) => void;
  onRemoveGroup: () => void;
}

export const ConditionGroup = ({
  group,
  groupIndex,
  isOnlyGroup,
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
    <div
      className={
        isOnlyGroup ? "space-y-3" : "border rounded-lg p-4 space-y-3 bg-background"
      }
    >
      {(!isOnlyGroup || group.conditions.length > 1) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {!isOnlyGroup && (
              <span className="font-medium">Grupo {groupIndex + 1}:</span>
            )}
            {group.conditions.length > 1 ? (
              <>
                <span className="text-muted-foreground">Deben cumplirse:</span>
                <OperatorToggle value={group.operator} onChange={onUpdateOperator} />
              </>
            ) : null}
          </div>
          {!isOnlyGroup && (
            <Button variant="ghost" size="icon" onClick={onRemoveGroup}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {group.conditions.map((condition, condIdx) => (
          <div key={condIdx}>
            {condIdx > 0 && (
              <div className="flex justify-center py-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {OPERATOR_CONNECTOR[group.operator]}
                </span>
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
        {group.conditions.length ? "Agregar otra condición" : "Agregar condición"}
      </Button>
    </div>
  );
};
