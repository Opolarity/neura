import { Fragment, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateDisplay } from "@/shared/utils/date";
import { formatPaper } from "../utils/formatPaper";
import type {
  PrintTemplateItem,
  SystemPrintTemplate,
} from "../types/printTemplates.types";
import type {
  PrintDocumentGroup,
  PrintDocumentRow,
} from "../hooks/usePrintTemplates";

/** El valor del radio de la plantilla del sistema (las otras van por id). */
const SYSTEM_VALUE = "system";

interface PrintDocumentsTableProps {
  groups: PrintDocumentGroup[];
  loading: boolean;
  isExpanded: (row: PrintDocumentRow) => boolean;
  onToggle: (code: string) => void;
  /** El documento cuya plantilla en uso se está cambiando. */
  changingCode: string | null;
  onUse: (row: PrintDocumentRow, id: number | null) => void;
  /** La personalizada que se está duplicando o eliminando. */
  busyId: number | null;
  onView: (system: SystemPrintTemplate) => void;
  onEdit: (item: PrintTemplateItem) => void;
  onDuplicate: (item: PrintTemplateItem) => void;
  onRemove: (item: PrintTemplateItem) => void;
  onCreate: (code: string) => void;
}

const COLUMNS = 4;

const paperOf = (system: SystemPrintTemplate) =>
  formatPaper(
    system.paperWidthMm,
    system.paperHeightMm,
    system.multiPage,
    Boolean(system.paperPresets?.length),
  );

/** Quién la hizo y cuándo se modificó por última vez. */
const templateMeta = (item: PrintTemplateItem) => {
  const date = item.updatedAt ?? item.createdAt;
  return [item.createdByName, date ? formatDateDisplay(date) : null]
    .filter(Boolean)
    .join(" · ");
};

/**
 * El listado por documento: un renglón por cada documento del ERP, agrupados
 * por área, con la plantilla con que se imprime. Al desplegarlo, todas sus
 * plantillas con un radio (se usa una sola): la del sistema, que es la de
 * siempre, y las personalizadas, con editar, duplicar y eliminar.
 */
export const PrintDocumentsTable = ({
  groups,
  loading,
  isExpanded,
  onToggle,
  changingCode,
  onUse,
  busyId,
  onView,
  onEdit,
  onDuplicate,
  onRemove,
  onCreate,
}: PrintDocumentsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Documento</TableHead>
        <TableHead>Plantilla en uso</TableHead>
        <TableHead>Medida</TableHead>
        <TableHead className="w-[60px]" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading && groups.every((group) => !group.documents.length) ? (
        <TableRow>
          <TableCell colSpan={COLUMNS} className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando...
            </div>
          </TableCell>
        </TableRow>
      ) : groups.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={COLUMNS}
            className="text-center text-muted-foreground p-10"
          >
            No se encontraron documentos
          </TableCell>
        </TableRow>
      ) : (
        groups.map((group) => (
          <Fragment key={group.area}>
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={COLUMNS}
                className="pt-5 pb-1 text-xs font-medium text-muted-foreground"
              >
                {group.area}
              </TableCell>
            </TableRow>
            {group.documents.map((row) => (
              <DocumentRows
                key={row.system.code}
                row={row}
                open={isExpanded(row)}
                onToggle={() => onToggle(row.system.code)}
                changing={changingCode === row.system.code}
                onUse={(id) => onUse(row, id)}
                busyId={busyId}
                onView={onView}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onCreate={() => onCreate(row.system.code)}
              />
            ))}
          </Fragment>
        ))
      )}
    </TableBody>
  </Table>
);

/** Un documento y, desplegado, sus plantillas. */
const DocumentRows = ({
  row,
  open,
  onToggle,
  changing,
  onUse,
  busyId,
  onView,
  onEdit,
  onDuplicate,
  onRemove,
  onCreate,
}: {
  row: PrintDocumentRow;
  open: boolean;
  onToggle: () => void;
  changing: boolean;
  onUse: (id: number | null) => void;
  busyId: number | null;
  onView: (system: SystemPrintTemplate) => void;
  onEdit: (item: PrintTemplateItem) => void;
  onDuplicate: (item: PrintTemplateItem) => void;
  onRemove: (item: PrintTemplateItem) => void;
  onCreate: () => void;
}) => {
  const { system, templates, inUse } = row;
  const Chevron = open ? ChevronDown : ChevronRight;
  // Ver la que se usa: la del sistema (si tiene diseño) o la personalizada.
  const canView = inUse !== null || Boolean(system.hasDesign);
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Chevron className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span>{system.section}</span>
            {templates.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {templates.length + 1} plantillas
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {changing && <Loader2 className="w-4 h-4 animate-spin" />}
            {inUse ? (
              <>
                <span>{inUse.title}</span>
                <Badge variant="secondary">Personalizada</Badge>
              </>
            ) : (
              <span className="text-muted-foreground">Diseño del sistema</span>
            )}
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">{paperOf(system)}</TableCell>
        <TableCell>
          {canView && (
            <Button
              variant="outline"
              size="sm"
              title="Ver la plantilla en uso"
              aria-label={`Ver la plantilla en uso de ${system.section}`}
              onClick={(event) => {
                event.stopPropagation();
                if (inUse) onEdit(inUse);
                else onView(system);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMNS} className="p-0">
            <RadioGroup
              value={inUse ? String(inUse.id) : SYSTEM_VALUE}
              onValueChange={(value) =>
                onUse(value === SYSTEM_VALUE ? null : Number(value))
              }
              disabled={changing}
              aria-label={`Plantilla en uso de ${system.section}`}
              className="gap-0 bg-muted/40"
            >
              <TemplateOption
                code={system.code}
                value={SYSTEM_VALUE}
                title="Diseño del sistema"
                meta="El de siempre, recomendado"
              >
                {system.hasDesign && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Ver plantilla"
                    aria-label={`Ver el diseño del sistema de ${system.section}`}
                    onClick={() => onView(system)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </TemplateOption>
              {templates.map((item) => (
                <TemplateOption
                  key={item.key}
                  code={system.code}
                  value={String(item.id)}
                  title={item.title}
                  meta={templateMeta(item)}
                >
                  {busyId === item.id ? (
                    <Loader2 className="w-4 h-4 m-2 animate-spin" />
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        aria-label={`Editar ${item.title}`}
                        onClick={() => onEdit(item)}
                      >
                        <SquarePen className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Duplicar"
                        aria-label={`Duplicar ${item.title}`}
                        onClick={() => onDuplicate(item)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        aria-label={`Eliminar ${item.title}`}
                        onClick={() => onRemove(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </TemplateOption>
              ))}
              <div className="border-t border-border pl-12 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={onCreate}
                >
                  <Plus className="w-4 h-4" />
                  Nueva plantilla para este documento
                </Button>
              </div>
            </RadioGroup>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

/** Una plantilla del documento: su radio, su nombre y sus acciones. */
const TemplateOption = ({
  code,
  value,
  title,
  meta,
  children,
}: {
  /** El documento: el id del radio es único en todo el listado. */
  code: string;
  value: string;
  title: string;
  meta: string;
  children?: ReactNode;
}) => {
  const id = `print-template-${code}-${value}`;
  return (
    <div className="flex items-center gap-3 border-t border-border pl-12 pr-4 py-2">
      <RadioGroupItem value={value} id={id} />
      <label htmlFor={id} className="flex-1 min-w-0 cursor-pointer text-sm">
        <span>{title}</span>
        {meta && (
          <span className="ml-2 text-xs text-muted-foreground">{meta}</span>
        )}
      </label>
      <div className="flex gap-1">{children}</div>
    </div>
  );
};
