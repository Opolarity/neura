import { useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { useAddMaterial } from "../../hooks/useAddMaterial";
import { AddSupplierModal } from "../suppliers/AddSupplierModal";
import { materialClassLabel } from "../../utils/materialClassLabel";
import {
  buildMaterialClassTree,
  flattenMaterialClassTree,
} from "../../utils/materialClassTree";

interface MaterialFormProps {
  hook: ReturnType<typeof useAddMaterial>;
  /**
   * Modo reducido: una sola columna y sin la tabla de stock por almacén.
   *
   * Lo usan las altas EN LÍNEA -- crear un material a mitad de escribir una
   * receta, o desde la orden de producción. Ahí el material nace y el stock
   * llega después con la compra; meter la tabla obligaría a decidir algo que
   * todavía no se sabe, y ese es justo el motivo por el que existe el alta
   * rápida. Es el mismo reparto que hace ExplosionQuickCreateDialog.
   */
  compact?: boolean;
}

/**
 * El formulario del material, compartido por la ficha y por el alta en línea.
 *
 * Vive aparte porque son dos envoltorios -- una página y un diálogo -- sobre
 * el MISMO formulario. Duplicarlo habría dejado dos sitios donde añadir cada
 * campo nuevo, y uno de los dos se habría quedado atrás.
 *
 * El LAYOUT lo pone este componente y no el envoltorio, igual que en la ficha
 * de producto: los datos y el inventario a la izquierda, y la clase y la
 * unidad a la derecha. Las dos columnas solo desde `lg`; por debajo se apilan,
 * porque la derecha mide 320 px fijos y sin apilar desbordaba la pantalla.
 * Antes el reparto lo imponía la página con una rejilla `sm:grid-cols-2`, y
 * eso ordenaba los campos por aparición en vez de por lo que son.
 */
export const MaterialForm = ({ hook, compact = false }: MaterialFormProps) => {
  const {
    isEditing,
    classes,
    units,
    warehouses,
    stockTypes,
    selectedStockType,
    setSelectedStockType,
    getStockFor,
    setStockFor,
    suppliers,
    loadingCatalogs,
    form,
    setField,
    selectedSupplierName,
    supplierSearchOpen,
    setSupplierSearchOpen,
    supplierSearch,
    setSupplierSearch,
    classSearch,
    setClassSearch,
    newClassDialogOpen,
    setNewClassDialogOpen,
    newClassName,
    setNewClassName,
    newClassParentId,
    setNewClassParentId,
    creatingClass,
    handleSaveClass,
    editingClassId,
    startEditingClass,
    cancelEditingClass,
    addSupplierOpen,
    setAddSupplierOpen,
    supplierCreated,
    images,
    uploadingImages,
    addImages,
    removeImage,
  } = hook;

  /** El input de fichero oculto tras el botón de subir. */
  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * Pulsado «Editar» y todavía sin decir qué clase.
   *
   * Es un estado de la pantalla y no del alta, por eso vive aquí y no en el
   * hook: el hook sabe qué clase se está editando, no por qué puerta se entró.
   */
  const [eligiendoClase, setEligiendoClase] = useState(false);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  /** El árbol de clases aplanado en el orden en que se pinta, con su nivel. */
  const classTree = useMemo(
    () => flattenMaterialClassTree(buildMaterialClassTree(classes)),
    [classes]
  );

  /**
   * Lo que ve el panel. Sin búsqueda, el árbol con su sangría; con búsqueda,
   * la lista plana.
   *
   * El filtrado NO puede conservar la sangría: al quedarse los hijos sin sus
   * padres, el nivel apuntaría a una jerarquía que ya no está en pantalla. Por
   * eso cada resultado se nombra con su ruta completa, que es lo que da el
   * contexto que la sangría dejó de dar.
   */
  const classOptions = useMemo(() => {
    const query = classSearch.trim().toLowerCase();

    if (query) {
      return classes
        .map((cls) => ({ cls, level: 0, label: materialClassLabel(cls, classes) }))
        .filter((opt) => opt.label.toLowerCase().includes(query))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return classTree.map((node) => ({
      cls: node,
      level: node.level,
      label: node.name,
    }));
  }, [classes, classSearch, classTree]);

  /** Ninguna clase cuelga de una familia, así que no hay nada que marcar. */
  const sinClasesElegibles = useMemo(
    () => classes.length > 0 && classes.every((c) => !c.parent_class_id),
    [classes]
  );

  // ------------------------------------------------------------------
  // Datos del material
  // ------------------------------------------------------------------
  const camposGenerales = (
    <>
      <div className="space-y-2">
        <Label>Nombre *</Label>
        <Input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Ej: Tela algodón"
          autoFocus
        />
      </div>

      {/* Proveedor — opcional: el insumo existe en la receta antes de decidir
          a quién se le compra. */}
      <div className="space-y-2">
        <Label>Proveedor</Label>
        <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              disabled={loadingCatalogs}
              className="w-full justify-between font-normal"
            >
              {selectedSupplierName || "Sin proveedor"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar proveedor..."
                value={supplierSearch}
                onValueChange={setSupplierSearch}
              />
              {/* max-h y no h: con altura FIJA la lista mide 160px aunque haya
                  dos proveedores --dejando un hueco muerto-- y, peor, no
                  desborda. Sin desbordar no hay nada que scrollear dentro, asi
                  que la rueda se la lleva el dialogo de detras --que tiene
                  overflow-y-auto-- y el popover se despega mientras el usuario
                  cree estar recorriendo la lista. */}
              <CommandList className="max-h-[260px]">
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      setField("supplier_id", "");
                      setSupplierSearch("");
                      setSupplierSearchOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        form.supplier_id === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Sin proveedor
                  </CommandItem>
                  {filteredSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.name}
                      onSelect={() => {
                        setField("supplier_id", supplier.id.toString());
                        setSupplierSearch("");
                        setSupplierSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.supplier_id === supplier.id.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {supplier.name}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Crear el proveedor aquí mismo.

                    Este formulario se abre a mitad de escribir una receta, y
                    salir a Proveedores para dar de alta uno era el único motivo
                    que quedaba para abandonarla. Mismo patrón que el alta de
                    material desde la línea, y que el de proveedor del diálogo
                    «Cotizar». */}
              </CommandList>

              {/* FUERA de la lista, no dentro.

                  Dentro scrollea con los proveedores, así que con veinte hay
                  que recorrerlos todos para llegar a crear el que falta -- que
                  es justo lo que se hace cuando no está en la lista. Aquí abajo
                  se queda fijo y siempre a la vista. */}
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-start gap-2 font-normal"
                  onClick={() => {
                    setSupplierSearchOpen(false);
                    setAddSupplierOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Crear proveedor
                  {supplierSearch.trim() && (
                    <span className="text-muted-foreground truncate">
                      «{supplierSearch.trim()}»
                    </span>
                  )}
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Costo unitario</Label>
        <Input
          type="number"
          step="0.01"
          value={form.unit_cost}
          onChange={(e) => setField("unit_cost", e.target.value)}
          placeholder="Ej: 12.50"
        />
      </div>
    </>
  );

  // ------------------------------------------------------------------
  // Clase de material — el panel de categorías del producto, tal cual
  // ------------------------------------------------------------------
  const panelClases = (
    <>
      {/* El buscador no está en categorías, pero aquí el árbol pasa de las 40
          filas -- cuatro familias de tela por una treintena de colores -- y sin
          él encontrar un color es scrollear a ojo. */}
      <Input
        value={classSearch}
        onChange={(e) => setClassSearch(e.target.value)}
        placeholder="Buscar clase..."
        disabled={loadingCatalogs}
        className="mb-2 h-8 text-sm"
      />

      <div className="max-h-[300px] space-y-1 overflow-y-auto">
        {classOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {loadingCatalogs ? "Cargando clases..." : "Sin resultados"}
          </p>
        ) : (
          classOptions.map(({ cls, level, label }) =>
            /* Las raíces --TELA, AVIOS-- son FAMILIAS, no clases de un
               material: se clasifica en algo que pertenece a ellas. Van sin
               casilla, como encabezado del grupo, en vez de con una casilla
               deshabilitada: una casilla que no se puede marcar invita a
               intentarlo y no explica por qué. */
            !cls.parent_class_id ? (
              <div
                key={cls.id}
                className="truncate pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:pt-0"
                style={{ paddingLeft: `${level * 16}px` }}
                title={label}
              >
                {label}
              </div>
            ) : (
            <div
              key={cls.id}
              className="flex items-center space-x-2"
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {/* Marcar otra SUSTITUYE a la actual: un material tiene una sola
                  clase (materials.material_class_id es un FK simple), al
                  contrario que las categorías de un producto. */}
              <Checkbox
                className="shrink-0"
                id={`clase-material-${cls.id}`}
                checked={form.material_class_id === cls.id.toString()}
                onCheckedChange={() =>
                  setField(
                    "material_class_id",
                    form.material_class_id === cls.id.toString()
                      ? ""
                      : cls.id.toString()
                  )
                }
              />
              {/* Nombres largos se cortan con «…» y el completo va en el
                  title: el diálogo tiene un ancho fijo y no debe crecer.

                  El `min-w-0` del span es lo que hace que eso ocurra de
                  verdad. Un elemento flex nace con `min-width: auto`, así que
                  NO encoge por debajo de su texto: el `truncate` de aquí no
                  llegaba a aplicarse nunca --el span crecía con el nombre-- y
                  con la búsqueda puesta, que enseña la ruta entera de la
                  clase, era lo que ensanchaba el diálogo. */}
              <Label
                htmlFor={`clase-material-${cls.id}`}
                className="flex min-w-0 cursor-pointer items-center gap-1 text-sm font-normal"
                title={label}
              >
                {level > 0 && (
                  <span className="shrink-0 text-xs text-muted-foreground">└</span>
                )}
                <span className="min-w-0 truncate">{label}</span>
              </Label>
            </div>
            )
          )
        )}
      </div>

      {/* Solo familias y nada debajo: el panel se vería como dos encabezados
          sin nada que marcar. Pasa en un tenant recién creado, que nace con
          TELA y AVIOS y ninguna hija. */}
      {!loadingCatalogs && !classSearch.trim() && sinClasesElegibles && (
        <p className="mt-2 text-xs text-muted-foreground">
          Todavía no hay clases dentro de las familias. Crea una con «Agregar»,
          colgándola de TELA o AVIOS.
        </p>
      )}

      {/* Alta en línea, con la forma de CategoryQuickAddForm. */}
      <div className="mt-3">
        <Collapsible
          open={newClassDialogOpen}
          onOpenChange={(open) => {
            setNewClassDialogOpen(open);
            // Cerrar el bloque olvida por qué puerta se entró: reabrirlo con
            // el selector puesto sin haberlo pedido sería un estado heredado.
            if (!open) setEligiendoClase(false);
          }}
        >
          {/* Dos botones y no uno que cambia de rótulo.

              Antes «Agregar» era la única entrada y corregir una clase estaba
              dentro, en un desplegable: quien no lo abría no se enteraba de que
              se podía. Cada acción tiene ahora su botón, y el que está en curso
              se marca solo. */}
          <div className="grid grid-cols-2 gap-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={
                  newClassDialogOpen && editingClassId === null && !eligiendoClase
                    ? "default"
                    : "outline"
                }
                className="justify-center gap-2"
                onClick={(event) => {
                  // Estando ya abierto EDITANDO, «Agregar» no cierra: cambia a
                  // alta. Cerrar dejaría al usuario pulsándolo dos veces para
                  // llegar a lo que pidió.
                  if (newClassDialogOpen && editingClassId !== null) {
                    event.preventDefault();
                  }
                  cancelEditingClass();
                  setEligiendoClase(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </CollapsibleTrigger>

            <CollapsibleTrigger asChild>
              <Button
                type="button"
                size="sm"
                // Marcado tambien mientras se elige cual: si no, pulsar
                // «Editar» dejaria los dos botones apagados y el selector
                // abierto sin que nada dijera de donde salio.
                variant={
                  editingClassId !== null || eligiendoClase ? "default" : "outline"
                }
                className="justify-center gap-2"
                // Sin clases no hay nada que corregir, y un botón que abre un
                // desplegable vacío es peor que uno apagado.
                disabled={classTree.length === 0}
                onClick={(event) => {
                  // Abierto en ALTA, «Editar» tampoco cierra: limpia el
                  // formulario y deja el selector a la vista.
                  if (newClassDialogOpen && editingClassId === null) {
                    event.preventDefault();
                  }
                  cancelEditingClass();
                  setEligiendoClase(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-2 pt-3">
            {/* Pulsado «Editar» y sin clase elegida todavía: lo único que hace
                falta es decir cuál. Enseñar debajo el nombre y el padre vacíos
                invitaría a rellenarlos creyendo que se está creando. */}
            {eligiendoClase && editingClassId === null ? (
              <Select
                value=""
                onValueChange={(value) => {
                  startEditingClass(Number(value));
                  setEligiendoClase(false);
                }}
              >
                <SelectTrigger className="min-w-0">
                  <SelectValue placeholder="¿Qué clase quieres corregir?" />
                </SelectTrigger>
                {/* El desplegable no puede crecer con el nombre mas largo:
                    se queda en el ancho del campo --que ya era su minimo-- y
                    el `[&>span:last-child]:min-w-0` deja encoger al texto del
                    item, que es lo que hace que el truncate de dentro corte
                    con «…» en vez de desbordar. El nombre completo sigue en el
                    title. */}
                <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                  {classTree.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id.toString()}
                      title={cls.name}
                      className="[&>span:last-child]:min-w-0"
                    >
                      <span
                        className="block truncate"
                        style={{ paddingLeft: `${cls.level * 12}px` }}
                      >
                        {cls.level > 0 && (
                          <span className="mr-1 text-xs text-muted-foreground">
                            └
                          </span>
                        )}
                        {cls.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
            <>
            <Input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Nombre de la clase"
              onKeyDown={(e) => e.key === "Enter" && handleSaveClass()}
            />
            <div className="flex items-center gap-2">
              <Select
                value={newClassParentId || "none"}
                onValueChange={(value) =>
                  setNewClassParentId(value === "none" ? "" : value)
                }
              >
                {/* min-w-0: sin él, flex-1 no deja al trigger encoger por
                    debajo de su contenido y una clase de nombre largo
                    ensancha el diálogo entero. Con él, el truncate del
                    trigger corta el nombre con «…». */}
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="Clase padre" />
                </SelectTrigger>
                {/* El desplegable no puede crecer con el nombre mas largo:
                    se queda en el ancho del campo --que ya era su minimo-- y
                    el `[&>span:last-child]:min-w-0` deja encoger al texto del
                    item, que es lo que hace que el truncate de dentro corte
                    con «…» en vez de desbordar. El nombre completo sigue en el
                    title. */}
                <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">Clase padre</SelectItem>
                  {/* CUALQUIER clase puede ser padre, no solo las raíces. Es lo
                      que permite montar TELA › JERSEY › DENIM: primero JERSEY
                      colgando de TELA, después el color colgando de JERSEY. */}
                  {classTree.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id.toString()}
                      title={cls.name}
                      className="[&>span:last-child]:min-w-0"
                    >
                      <span
                        className="block truncate"
                        style={{ paddingLeft: `${cls.level * 12}px` }}
                      >
                        {cls.level > 0 && (
                          <span className="mr-1 text-xs text-muted-foreground">
                            └
                          </span>
                        )}
                        {cls.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={handleSaveClass}
                disabled={creatingClass || !newClassName.trim()}
              >
                {creatingClass ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingClassId !== null ? (
                  "Guardar"
                ) : (
                  "Crear"
                )}
              </Button>
            </div>

            {/* Editar una que ya existe, sin salir del material.
            
                Es donde se descubre el error: uno crea la clase a mitad de dar
                de alta un material, la escribe mal o la cuelga de la familia
                equivocada, y sin esto habria que salir a Materiales, buscarla
                y volver. */}
            {/* El desplegable de «…o corregir una que ya existe» que había aquí
                se retiró: era la única entrada a la edición y estaba escondida
                dentro del bloque de alta. Ahora esa puerta es el botón
                «Editar» de arriba. */}
            {editingClassId !== null && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                  Se guarda encima de la clase elegida.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    cancelEditingClass();
                    setEligiendoClase(true);
                  }}
                >
                  Elegir otra
                </Button>
              </div>
            )}
            </>
            )}

          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );

  // ------------------------------------------------------------------
  // Unidad de medida
  // ------------------------------------------------------------------
  const selectorUnidad = (
    /* Antes era texto libre, y por eso convivían «m», «MTR» y «metros» para la
       misma unidad: cuatro valores distintos para la base y uno solo para el
       negocio. Ahora sale del catálogo. */
    <Select
      value={form.measurement_unit}
      onValueChange={(value) => setField("measurement_unit", value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar unidad..." />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit.id} value={unit.code}>
            {unit.name} ({unit.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ------------------------------------------------------------------
  // Stock por almacén — la tabla de la pestaña Inventario del producto
  // ------------------------------------------------------------------
  const tablaStock = (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm font-medium">Tipo de Inventario:</Label>
        <Select
          value={selectedStockType?.toString() || ""}
          onValueChange={(value) => setSelectedStockType(Number(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {stockTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {warehouses.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay almacenes activos donde registrar stock.
        </p>
      ) : (
        /* Una columna por almacén y scroll HORIZONTAL, como la pestaña de
           inventario del producto. Allí las filas son las variaciones; aquí
           solo hay una, la del propio material, así que el scroll que hace
           falta es el de las columnas.

           No se copia el `h-55` de productos: no es una clase de Tailwind y no
           genera nada -- comprobado que `.h-55` no existe en el CSS compilado.
           Allí lo que funciona es este mismo scroll horizontal. */
        <div className="overflow-x-auto rounded-lg border">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 min-w-[110px] bg-background">
                    Stock
                  </TableHead>
                  {warehouses.map((wh) => (
                    <TableHead key={wh.id} className="min-w-[120px] text-center">
                      {wh.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky left-0 bg-inherit font-medium">
                    Cantidad
                  </TableCell>
                  {warehouses.map((wh) => (
                    <TableCell key={wh.id} className="p-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={getStockFor(wh.id) ?? ""}
                        onChange={(e) => setStockFor(wh.id, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </>
  );

  /**
   * El alta de proveedor, compartida por los dos layouts.
   *
   * Se monta al abrir para que arranque en blanco, y vive fuera del Popover
   * del buscador: montada dentro, cerrar el popover al pulsar «Crear
   * proveedor» se llevaria el modal por delante.
   */
  const modalProveedor = addSupplierOpen && (
    <AddSupplierModal
      open
      onOpenChange={setAddSupplierOpen}
      onCreated={supplierCreated}
    />
  );

  // ------------------------------------------------------------------
  // Alta en línea: una columna, sin tarjetas ni stock
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Imágenes: el mismo bloque que la pestaña Imágenes del producto, sin
  // orden -- un material solo necesita enseñar cómo es.
  // ------------------------------------------------------------------
  const panelImagenes = (
    <div className="space-y-4">
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Se limpia para poder volver a elegir el mismo fichero.
          e.target.value = "";
          void addImages(files);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => imageInputRef.current?.click()}
        disabled={uploadingImages}
      >
        {uploadingImages ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {uploadingImages ? "Subiendo..." : "Seleccionar imágenes"}
      </Button>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square">
              <img
                src={url}
                alt=""
                className="h-full w-full rounded-lg border object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute right-1 top-1 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(url)}
                aria-label="Quitar imagen"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No hay imágenes.
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        {/* La clase va PRIMERO en el alta en línea, al revés que en la ficha.
            Aquí el material nace a mitad de escribir una receta, y lo primero
            que se sabe de él es qué es --tela, avío-- antes que cómo se llama.
            De paso, si hay que crear o corregir la clase, se hace al entrar y
            no después de haber tecleado el resto. */}
        <div className="space-y-2">
          <Label>Clase de material *</Label>
          <div className="rounded-lg border p-3">{panelClases}</div>
        </div>

        {camposGenerales}

        {/* El formulario se abre desde una receta o desde una orden, donde
            parece que se estuviera tocando esa receta y no el catálogo. El
            costo es del material: cambiarlo mueve el de todas. */}
        {isEditing && (
          <p className="text-muted-foreground text-xs">
            Los cambios valen para todas las recetas y órdenes que usen este
            material.
          </p>
        )}

        <div className="space-y-2">
          <Label>Unidad de medida *</Label>
          {selectorUnidad}
        </div>

        {modalProveedor}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Ficha completa: dos columnas, igual que la de producto
  // ------------------------------------------------------------------
  return (
    // Apiladas por defecto y en dos columnas solo cuando hay sitio. Era un
    // `flex-row` a secas con la derecha en `w-80 shrink-0`: la izquierda
    // encogía hasta cero pero la derecha imponía 320 px, así que por debajo de
    // ~1100 px la página entera se desbordaba y había que arrastrarla de lado
    // para llegar a la clase y a la unidad.
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{camposGenerales}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
          </CardHeader>
          <CardContent>{tablaStock}</CardContent>
        </Card>
      </div>

      {/* 320 px en escritorio --que es lo que mantiene clase y unidad juntas a
          un lado-- y el ancho completo cuando se apila. */}
      <div className="w-full shrink-0 space-y-5 lg:w-80">
        <Card>
          <CardHeader>
            <CardTitle>Clase de material</CardTitle>
          </CardHeader>
          <CardContent>{panelClases}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unidad de medida</CardTitle>
          </CardHeader>
          <CardContent>{selectorUnidad}</CardContent>
        </Card>

        {/* Solo en la ficha: el alta en línea pide lo imprescindible, y una
            foto no lo es. */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent>{panelImagenes}</CardContent>
        </Card>
      </div>

      {modalProveedor}
    </div>
  );
};

export default MaterialForm;
