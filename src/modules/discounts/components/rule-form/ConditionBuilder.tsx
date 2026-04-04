import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConditionsConfig, Condition } from "../../types/priceRule.types";
import { ConditionGroup } from "./ConditionGroup";

interface ConditionBuilderProps {
  conditions: ConditionsConfig;
  setGroupOperator: (operator: "AND" | "OR") => void;
  addGroup: () => void;
  removeGroup: (groupIndex: number) => void;
  updateGroupOperator: (groupIndex: number, operator: "AND" | "OR") => void;
  addCondition: (groupIndex: number, condition: Condition) => void;
  updateCondition: (groupIndex: number, conditionIndex: number, condition: Condition) => void;
  removeCondition: (groupIndex: number, conditionIndex: number) => void;
}

export const ConditionBuilder = ({
  conditions,
  setGroupOperator,
  addGroup,
  removeGroup,
  updateGroupOperator,
  addCondition,
  updateCondition,
  removeCondition,
}: ConditionBuilderProps) => {
  return (
    <div className="space-y-4">
      {/* Operator between groups */}
      {conditions.groups.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Operador entre grupos:</span>
          <div className="flex gap-1">
            <Badge
              variant={conditions.operator === "AND" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupOperator("AND")}
            >
              AND
            </Badge>
            <Badge
              variant={conditions.operator === "OR" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupOperator("OR")}
            >
              OR
            </Badge>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-3">
        {conditions.groups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {groupIdx > 0 && (
              <div className="flex justify-center py-2">
                <Badge variant="secondary">{conditions.operator}</Badge>
              </div>
            )}
            <ConditionGroup
              group={group}
              groupIndex={groupIdx}
              canRemove={conditions.groups.length > 1}
              onUpdateOperator={(op) => updateGroupOperator(groupIdx, op)}
              onAddCondition={(c) => addCondition(groupIdx, c)}
              onUpdateCondition={(cIdx, c) => updateCondition(groupIdx, cIdx, c)}
              onRemoveCondition={(cIdx) => removeCondition(groupIdx, cIdx)}
              onRemoveGroup={() => removeGroup(groupIdx)}
            />
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addGroup}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Grupo de Condiciones
      </Button>

      {conditions.groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sin condiciones: la regla se aplicará siempre
        </p>
      )}
    </div>
  );
};
