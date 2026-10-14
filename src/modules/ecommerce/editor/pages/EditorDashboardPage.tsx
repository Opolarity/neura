// Listado del editor visual del ecommerce dentro del ERP ("Editor de sitio").
//
// La lógica es la del dashboard de ecommerce-multicliente (app/(admin)/editor):
// mismas secciones, mismos datos (usePagedVisualEdits) y la misma tabla con sus
// acciones. Lo que cambia es el armazón, con el diseño del ERP: va dentro del
// DashboardLayout, las secciones son pestañas con contador en vez de un menú
// lateral propio, y no hay sesión del editor (D7): vale la del ERP.
import { useCallback, useMemo, useState } from "react";
import {
  AppWindow,
  Blocks,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComponentPermission } from "@/shared/components/component-permission";
import { toastError } from "@/shared/utils/toastError";
import { cn } from "@/shared/utils/utils";
import { generateSSOToken } from "@/modules/ecommerce/services/sso.service";
import { usePagedVisualEdits } from "@/modules/ecommerce/editor/hooks/use-paged-visual-edits";
import {
  useEditorChannel,
  type EditorChannel,
} from "@/modules/ecommerce/editor/hooks/use-editor-channel";
import { TAMANOS_DE_PAGINA } from "@/modules/ecommerce/editor/components/list-pagination";
import { SectionToolbar } from "@/modules/ecommerce/editor/components/dashboard/section-toolbar";
import { SectionTable } from "@/modules/ecommerce/editor/components/dashboard/section-table";
import {
  NewModalDialog,
  NewPageDialog,
} from "@/modules/ecommerce/editor/components/dashboard/create-dialogs";
import { type VisualEditRecord } from "@/modules/ecommerce/editor/lib/editor-store";
import "@/modules/ecommerce/editor/editor.css";

/** Cuántos esqueletos se pintan mientras carga (tope, no el tamaño de página). */
const FILAS_ESQUELETO = 10;

type SectionKey = "blocks" | "pages" | "modals" | "trash";

interface SectionConfig {
  label: string;
  icon: LucideIcon;
  /** Los tipos que agrupa. "Páginas" son dos: la home es una página aparte. */
  types: VisualEditRecord["type"][];
  /** El prefijo con el que se lee el slug bajo el nombre. */
  slugPrefix: string;
  /** Cómo se nombran las filas en el pie ("de 6 bloques"). */
  plural: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  /** Sin esto la sección no ofrece crear nada. Es el caso de Bloques. */
  createLabel?: string;
}

// Mismas secciones que el dashboard del ecommerce.
const SECTIONS: Record<SectionKey, SectionConfig> = {
  blocks: {
    label: "Bloques",
    icon: Blocks,
    types: ["block"],
    slugPrefix: "/",
    plural: "bloques",
    searchPlaceholder: "Buscar por nombre o slug",
    emptyTitle: "Aún no hay bloques",
    emptyText:
      "Los bloques son las piezas que la tienda monta por su cuenta: cabecera, pie, menús y mega-menú.",
  },
  pages: {
    label: "Páginas",
    icon: FileText,
    types: ["page", "home"],
    slugPrefix: "/p/",
    plural: "páginas",
    searchPlaceholder: "Buscar por nombre o slug",
    emptyTitle: "Aún no hay páginas",
    emptyText:
      "Se guardará como borrador hasta que la publiques. Los borradores no son visibles en el sitio.",
    createLabel: "Nueva página",
  },
  modals: {
    label: "Modales / Popups",
    icon: AppWindow,
    types: ["modal"],
    slugPrefix: "/",
    plural: "modales",
    searchPlaceholder: "Buscar por nombre o slug",
    emptyTitle: "Aún no hay modales",
    emptyText:
      "Se guardará como borrador hasta que lo publiques. Los borradores no son visibles en el sitio.",
    createLabel: "Nuevo modal",
  },
  trash: {
    // La papelera junta lo enviado de páginas y modales; los bloques no van a
    // la papelera.
    label: "Papelera",
    icon: Trash2,
    types: ["page", "home", "modal"],
    slugPrefix: "/",
    plural: "elementos",
    searchPlaceholder: "Buscar en la papelera",
    emptyTitle: "La papelera está vacía",
    emptyText:
      "Lo que envíes a la papelera aparece aquí. Puedes restaurarlo como borrador o eliminarlo definitivamente.",
  },
};

const ORDEN: SectionKey[] = ["blocks", "pages", "modals", "trash"];

export default function EditorDashboardPage() {
  const { canal, canales, estado, cambiarCanal } = useEditorChannel();

  return (
    <div className="editor-ecommerce h-full min-h-0">
      {/* La tabla y los diálogos avisan con toast de "sonner". */}
      <Toaster position="bottom-right" richColors />
      {estado === "cargando" ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando…
        </div>
      ) : estado !== "listo" || !canal ? (
        <div className="flex h-full items-center justify-center">
          <div className="mx-4 max-w-md text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {estado === "error"
                ? "No se pudieron cargar los canales del ecommerce"
                : "Este negocio no tiene un ecommerce configurado"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {estado === "error"
                ? "Recarga la página para intentarlo de nuevo."
                : "Se necesita un canal web para editar sus páginas."}
            </p>
          </div>
        </div>
      ) : (
        // Al cambiar de canal se remonta: el listado vuelve a pedir y no arrastra
        // búsqueda ni página del canal anterior.
        <EditorDashboard
          key={canal.id}
          canal={canal}
          canales={canales}
          onCambiarCanal={cambiarCanal}
        />
      )}
    </div>
  );
}

function EditorDashboard({
  canal,
  canales,
  onCambiarCanal,
}: {
  canal: EditorChannel;
  canales: EditorChannel[];
  onCambiarCanal: (id: number) => void;
}) {
  const [section, setSection] = useState<SectionKey>("blocks");
  const config = SECTIONS[section];
  const [size, setSize] = useState(TAMANOS_DE_PAGINA[0]);

  // Una sola petición por vista: de ella salen las filas de la sección abierta,
  // los conteos del filtro de estado y los de las pestañas.
  const list = usePagedVisualEdits({
    types: config.types,
    size,
    trash: section === "trash",
  });

  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [modalDialogOpen, setModalDialogOpen] = useState(false);
  const [abriendoSitio, setAbriendoSitio] = useState(false);

  const { typeCounts } = list;
  const contadores = useMemo<Record<SectionKey, number | undefined>>(
    () => ({
      blocks: typeCounts.block ?? 0,
      // La home cuenta como página: es de las que se editan, solo que su fila es
      // de otro tipo.
      pages: (typeCounts.page ?? 0) + (typeCounts.home ?? 0),
      modals: typeCounts.modal ?? 0,
      // La papelera no lleva conteo: sus filas salen de otra petición (trash=1),
      // así que los type_counts de la vista normal no las cuentan.
      trash: undefined,
    }),
    [typeCounts],
  );

  // Cambiar de sección estrena su búsqueda y vuelve a "Todos".
  const cambiarSeccion = useCallback(
    (siguiente: SectionKey) => {
      if (siguiente === section) return;
      setSection(siguiente);
      list.setSearch("");
      list.setStatus("all");
      list.setPage(1);
    },
    [section, list],
  );

  const abrirCreacion = useCallback(() => {
    if (section === "pages") setPageDialogOpen(true);
    if (section === "modals") setModalDialogOpen(true);
  }, [section]);

  // Lo recién creado encabeza la primera página; los filtros se limpian para que
  // no quede escondido tras uno activo.
  const trasCrear = useCallback(() => {
    list.setSearch("");
    list.setStatus("all");
    list.refresh(true);
  }, [list]);

  const cambiarTamano = useCallback(
    (nuevo: number) => {
      setSize(nuevo);
      list.setPage(1);
    },
    [list],
  );

  // "Ver sitio" entra a la tienda con el SSO (D4): así la tienda reconoce a
  // quien edita y le enseña también lo privado y lo programado. `next` dice a
  // qué página ir tras canjear el token.
  const verSitio = useCallback(async () => {
    setAbriendoSitio(true);
    // La pestaña se abre ya, dentro del clic: abrirla después del await la
    // bloquearían los navegadores como ventana emergente.
    const pestana = window.open("about:blank", "_blank");
    try {
      const { token } = await generateSSOToken(canal.id);
      // channels.url puede venir con o sin "/" final.
      const base = canal.url.endsWith("/") ? canal.url : `${canal.url}/`;
      const destino = `${base}editor?token=${encodeURIComponent(token)}&next=${encodeURIComponent("/")}`;
      if (pestana) pestana.location.href = destino;
      else window.open(destino, "_blank");
    } catch (error) {
      pestana?.close();
      toastError(error, "No se pudo abrir el sitio");
    } finally {
      setAbriendoSitio(false);
    }
  }, [canal]);

  const botonCrear = config.createLabel ? (
    <ComponentPermission codeIn={["ecommerce_editor.edit"]}>
      <Button className="h-10 gap-2 px-4 font-semibold" onClick={abrirCreacion}>
        <Plus className="h-4 w-4" />
        {config.createLabel}
      </Button>
    </ComponentPermission>
  ) : null;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1240px] flex-col gap-4">
      {/* Cabecera: título y acciones. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-foreground">
          Editor de sitio
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* El canal se ve siempre: las páginas, bloques y modales son de un
              canal (visual_edits.channel_id). Con uno solo es una etiqueta; con
              varios (p. ej. minorista y mayorista), un selector. */}
          {canales.length > 1 ? (
            // Desactivado mientras carga: al cambiar de canal el listado se
            // remonta y pide el nuevo; hasta que llega no se puede volver a
            // cambiar (evita cambios encadenados con peticiones a medias).
            <Select
              value={String(canal.id)}
              onValueChange={(valor) => onCambiarCanal(Number(valor))}
              disabled={list.loading}
            >
              <SelectTrigger className="h-10 w-auto min-w-[220px] gap-2" aria-label="Canal del ecommerce">
                <span className="text-muted-foreground">Canal:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canales.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
              <span className="text-muted-foreground">Canal:</span>
              <span className="font-medium text-foreground">{canal.name}</span>
            </span>
          )}

          <Button
            variant="outline"
            className="h-10 gap-2 px-3.5 font-semibold"
            onClick={verSitio}
            disabled={abriendoSitio}
          >
            {abriendoSitio ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Ver sitio
          </Button>

          {botonCrear}
        </div>
      </div>

      {/* Secciones: pestañas con su conteo. */}
      {/* La línea de abajo es una sombra interior y no un border-b: con border,
          el subrayado de la pestaña activa tenía que bajar 1px (-mb-px) para
          pisarla, y ese píxel desbordaba en vertical; con overflow-x-auto el
          navegador sacaba entonces una barra de scroll vertical. */}
      <nav
        aria-label="Secciones del editor"
        className="flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_hsl(var(--border))]"
      >
        {ORDEN.map((clave) => {
          const activa = clave === section;
          const conteo = contadores[clave];
          return (
            <button
              key={clave}
              type="button"
              onClick={() => cambiarSeccion(clave)}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition-colors",
                activa
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{SECTIONS[clave].label}</span>
              {conteo !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-px text-xs font-semibold tabular-nums",
                    activa ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {conteo}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* La tarjeta: filtros, tabla y pie. La tabla desplaza sus filas dentro. */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background">
        {(list.loading || list.counts.all > 0 || list.isFiltering) && (
          <SectionToolbar
            status={list.status}
            onStatusChange={list.setStatus}
            counts={list.counts}
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={config.searchPlaceholder}
            loading={list.loading}
            hideStatus={section === "trash"}
          />
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <SectionTable
            items={list.items}
            icon={config.icon}
            slugPrefix={config.slugPrefix}
            onChanged={list.refresh}
            loading={list.loading}
            error={list.error}
            onRetry={list.retry}
            skeletonRows={Math.min(list.size, FILAS_ESQUELETO)}
            emptyTitle={list.isFiltering ? "Sin resultados" : config.emptyTitle}
            emptyText={
              list.isFiltering
                ? "Ningún elemento coincide con lo que estás filtrando. Prueba con otra búsqueda o cambia el estado."
                : config.emptyText
            }
            emptyAction={list.isFiltering ? undefined : botonCrear}
            trashView={section === "trash"}
          />
        </div>

        <PieDePaginacion
          page={list.page}
          size={list.size}
          total={list.total}
          totalPages={list.totalPages}
          loading={list.loading}
          plural={config.plural}
          onPageChange={list.setPage}
          onSizeChange={cambiarTamano}
        />
      </section>

      <NewPageDialog open={pageDialogOpen} onOpenChange={setPageDialogOpen} onCreated={trasCrear} />
      <NewModalDialog open={modalDialogOpen} onOpenChange={setModalDialogOpen} onCreated={trasCrear} />
    </div>
  );
}

/** Pie del diseño: "Mostrando 1 a 6 de 6 bloques" y, a la derecha, filas y páginas. */
function PieDePaginacion({
  page,
  size,
  total,
  totalPages,
  loading,
  plural,
  onPageChange,
  onSizeChange,
}: {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  loading: boolean;
  plural: string;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}) {
  // Sin resultados el estado vacío de la tabla ya lo explica todo.
  if (total === 0 && !loading) return null;

  const desde = total === 0 ? 0 : (page - 1) * size + 1;
  const hasta = Math.min(page * size, total);
  const puedeRetroceder = page > 1 && !loading;
  const puedeAvanzar = page < totalPages && !loading;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5 text-sm text-muted-foreground">
      <span className="tabular-nums">
        Mostrando {desde} a {hasta} de {total} {plural}
      </span>
      <div className="flex items-center gap-1">
        <label className="mr-2 inline-flex items-center gap-2">
          Filas
          <Select value={String(size)} onValueChange={(valor) => onSizeChange(Number(valor))}>
            <SelectTrigger className="h-9 w-[72px]" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANOS_DE_PAGINA.map((opcion) => (
                <SelectItem key={opcion} value={String(opcion)}>
                  {opcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={!puedeRetroceder}
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2 font-semibold text-primary-foreground tabular-nums">
          {page}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={!puedeAvanzar}
          aria-label="Página siguiente"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
