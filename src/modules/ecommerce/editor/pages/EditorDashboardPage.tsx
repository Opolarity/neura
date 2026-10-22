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
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComponentPermission } from "@/shared/components/component-permission";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { toastError } from "@/shared/utils/toastError";
import { generateSSOToken } from "@/modules/ecommerce/services/sso.service";
import { usePagedVisualEdits } from "@/modules/ecommerce/editor/hooks/use-paged-visual-edits";
import {
  useEditorChannel,
  type EditorChannel,
} from "@/modules/ecommerce/editor/hooks/use-editor-channel";
import { SectionToolbar } from "@/modules/ecommerce/editor/components/dashboard/section-toolbar";
import { SectionTable } from "@/modules/ecommerce/editor/components/dashboard/section-table";
import EditorDashboardHeader from "@/modules/ecommerce/editor/components/dashboard/EditorDashboardHeader";
import {
  NewModalDialog,
  NewPageDialog,
} from "@/modules/ecommerce/editor/components/dashboard/create-dialogs";
import { type VisualEditRecord } from "@/modules/ecommerce/editor/lib/editor-store";
import "@/modules/ecommerce/editor/editor.css";

/** Cuántos esqueletos se pintan mientras carga (tope, no el tamaño de página). */
const FILAS_ESQUELETO = 10;

/** El tamaño de arranque: el primero que ofrece el PageLimit del ERP. */
const TAMANO_INICIAL = 20;

type SectionKey = "blocks" | "pages" | "modals" | "trash";

interface SectionConfig {
  label: string;
  icon: LucideIcon;
  /** Los tipos que agrupa. "Páginas" son dos: la home es una página aparte. */
  types: VisualEditRecord["type"][];
  /** El prefijo con el que se lee el slug bajo el nombre. */
  slugPrefix: string;
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
    icon: Trash,
    types: ["page", "home", "modal"],
    slugPrefix: "/",
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
        <PageLoader message="Cargando editor..." />
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
  const [size, setSize] = useState(TAMANO_INICIAL);

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
      <Button className="gap-2" onClick={abrirCreacion}>
        <Plus className="h-4 w-4" />
        {config.createLabel}
      </Button>
    </ComponentPermission>
  ) : null;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <EditorDashboardHeader>
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
              <SelectTrigger className="w-auto min-w-[220px] gap-2" aria-label="Canal del ecommerce">
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
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <span className="text-muted-foreground">Canal:</span>
              <span className="font-medium text-foreground">{canal.name}</span>
            </span>
          )}

          <Button
            variant="outline"
            className="gap-2"
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
      </EditorDashboardHeader>

      {/* Secciones: el mismo conmutador que el filtro de estado de la tabla. */}
      <Tabs
        value={section}
        onValueChange={(valor) => cambiarSeccion(valor as SectionKey)}
        className="shrink-0 overflow-x-auto"
      >
        <TabsList aria-label="Secciones del editor">
          {ORDEN.map((clave) => {
            const conteo = contadores[clave];
            return (
              <TabsTrigger key={clave} value={clave} className="gap-2">
                {SECTIONS[clave].label}
                {conteo !== undefined && (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {conteo}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* La tarjeta: filtros, tabla y paginación. La tabla desplaza sus filas dentro. */}
      <Card className="flex flex-col min-h-0 overflow-hidden">
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

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
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
        </CardContent>

        {/* Sin resultados el estado vacío de la tabla ya lo explica todo. Mientras
            carga sí se pinta: si apareciera al llegar las filas, el pie le robaría
            alto de golpe a la tabla que se acaba de dibujar. */}
        {(list.total > 0 || list.loading) && (
          <CardFooter className="!p-0">
            <PaginationBar
              pagination={{ p_page: list.page, p_size: list.size, total: list.total }}
              onPageChange={list.setPage}
              onPageSizeChange={cambiarTamano}
            />
          </CardFooter>
        )}
      </Card>

      <NewPageDialog open={pageDialogOpen} onOpenChange={setPageDialogOpen} onCreated={trasCrear} />
      <NewModalDialog open={modalDialogOpen} onOpenChange={setModalDialogOpen} onCreated={trasCrear} />
    </div>
  );
}
