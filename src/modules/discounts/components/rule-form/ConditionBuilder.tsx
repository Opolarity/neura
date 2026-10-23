import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConditionsConfig, Condition } from "../../types/priceRule.types";
import {
  isConsignmentMarkerGroup,
  isFranchiseeExclusionMarkerGroup,
} from "../../adapters/priceRule.adapter";
import { ConditionGroup } from "./ConditionGroup";
import { OperatorToggle, OPERATOR_CONNECTOR } from "./OperatorToggle";

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
  // El grupo marcador de "promoción de consignación" no se edita a mano:
  // se gestiona con su casilla en Opciones avanzadas y acá se esconde.
  const visibleGroups = conditions.groups
    .map((group, originalIndex) => ({ group, originalIndex }))
    .filter(
      ({ group }) =>
        !isConsignmentMarkerGroup(group) &&
        !isFranchiseeExclusionMarkerGroup(group),
    );
  const isOnlyGroup = visibleGroups.length === 1;
  const hasConditions = visibleGroups.some(
    ({ group }) => group.conditions.length > 0,
  );

  return (
    <div className="space-y-4">
      {!hasConditions && (
        <p className="text-sm text-muted-foreground">
          Sin condiciones, el descuento se aplica en todas las ventas.
        </p>
      )}

      {/* Operator between groups */}
      {visibleGroups.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Grupos que deben cumplirse:</span>
          <OperatorToggle
            value={conditions.operator}
            onChange={setGroupOperator}
            labels={{ AND: "todos", OR: "al menos uno" }}
          />
        </div>
      )}

      {/* Groups */}
      <div className="space-y-3">
        {visibleGroups.map(({ group, originalIndex }, visibleIdx) => (
          <div key={originalIndex}>
            {visibleIdx > 0 && (
              <div className="flex justify-center py-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {OPERATOR_CONNECTOR[conditions.operator]}
                </span>
              </div>
            )}
            <ConditionGroup
              group={group}
              groupIndex={visibleIdx}
              isOnlyGroup={isOnlyGroup}
              onUpdateOperator={(op) => updateGroupOperator(originalIndex, op)}
              onAddCondition={(c) => addCondition(originalIndex, c)}
              onUpdateCondition={(cIdx, c) =>
                updateCondition(originalIndex, cIdx, c)
              }
              onRemoveCondition={(cIdx) => removeCondition(originalIndex, cIdx)}
              onRemoveGroup={() => removeGroup(originalIndex)}
            />
          </div>
        ))}
      </div>

      {visibleGroups.length === 0 && (
        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="w-3 h-3 mr-1" />
          Agregar condición
        </Button>
      )}

      {/* Los grupos son para combinaciones del tipo "(A y B) o C": se dejan a
          mano pero discretos, y solo cuando ya hay alguna condición. */}
      {hasConditions && (
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0 text-muted-foreground"
          onClick={addGroup}
        >
          <Plus className="w-3 h-3 mr-1" />
          Agregar grupo de condiciones
        </Button>
      )}
    </div>
  );
};
