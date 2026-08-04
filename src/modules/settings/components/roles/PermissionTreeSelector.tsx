import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { PermissionNode } from "../../types/Permissions.types";

interface PermissionTreeSelectorProps {
  nodes: PermissionNode[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  disabled?: boolean;
  emptyMessage: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

// El `code` no se muestra en la lista, pero sí se busca a propósito: los
// nombres están en español y los codes en inglés, así que buscar "invoice"
// encuentra "Lista de comprobantes".
const matches = (node: PermissionNode, term: string) =>
  node.name.toLowerCase().includes(term) ||
  node.code.toLowerCase().includes(term);

/**
 * Filtra el árbol conservando la cadena de padres de todo nodo que coincida:
 * un padre que no coincide se mantiene si algún descendiente sí lo hace, para
 * no dejar hijos huérfanos en pantalla. Si el que coincide es el padre, se
 * muestra su subárbol completo.
 */
const filterTree = (nodes: PermissionNode[], term: string): PermissionNode[] =>
  nodes.reduce<PermissionNode[]>((acc, node) => {
    if (matches(node, term)) {
      acc.push(node);
      return acc;
    }

    const children = filterTree(node.children, term);
    if (children.length > 0) {
      acc.push({ ...node, children });
    }
    return acc;
  }, []);

const countDescendants = (node: PermissionNode): number =>
  node.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);

const countSelectedDescendants = (
  node: PermissionNode,
  selected: Set<number>
): number =>
  node.children.reduce(
    (acc, child) =>
      acc +
      (selected.has(child.id) ? 1 : 0) +
      countSelectedDescendants(child, selected),
    0
  );

const PermissionTreeSelector = ({
  nodes,
  selectedIds,
  onToggle,
  disabled = false,
  emptyMessage,
  search,
  onSearchChange,
  searchPlaceholder = "Buscar permiso...",
}: PermissionTreeSelectorProps) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const term = search.trim().toLowerCase();
  const visibleNodes = useMemo(
    () => (term ? filterTree(nodes, term) : nodes),
    [nodes, term]
  );

  const toggleCollapse = (nodeId: number) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: PermissionNode, level = 0) => {
    const hasChildren = node.children.length > 0;
    // Durante una búsqueda se ignora el colapso: si un hijo coincide, tiene
    // que verse aunque el padre estuviera colapsado.
    const isExpanded = term ? true : !collapsedNodes.has(node.id);
    const totalDescendants = hasChildren ? countDescendants(node) : 0;
    const selectedDescendants = hasChildren
      ? countSelectedDescendants(node, selected)
      : 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1"
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {hasChildren ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleCollapse(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <Checkbox
            id={`permission-${node.id}`}
            checked={selected.has(node.id)}
            onCheckedChange={() => onToggle(node.id)}
            disabled={disabled}
          />

          <Label
            htmlFor={`permission-${node.id}`}
            className="text-sm cursor-pointer flex items-baseline gap-2"
          >
            {node.name}
            {hasChildren && (
              <span className="text-xs text-muted-foreground">
                ({selectedDescendants}/{totalDescendants})
              </span>
            )}
          </Label>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {visibleNodes.length > 0 ? (
          visibleNodes.map((node) => renderNode(node))
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            Ningún permiso coincide con "{search}".
          </p>
        )}
      </div>
    </div>
  );
};

export default PermissionTreeSelector;
