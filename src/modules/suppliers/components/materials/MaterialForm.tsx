import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronsUpDown, Loader2, Upload, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { SupplierOption } from "../../types/materials.types";

interface MaterialFormProps {
  hook: ReturnType<typeof useAddMaterial>;
  /**
   * Modo reducido: una sola columna, sin atributos ni stock.
   *
   * Lo usan las altas EN LÍNEA -- crear un material a mitad de escribir una
   * receta, o desde la orden de producción. Ahí el material nace simple y el
   * stock llega después con la compra.
   */
  compact?: boolean;
}

interface SupplierPickerProps {
  suppliers: SupplierOption[];
  value: string;
  valueName: string;
  disabled?: boolean;
  onChange: (supplierId: string) => void;
  onCreate: () => void;
  className?: string;
}

/**
 * El buscador de proveedor, con «Sin proveedor» y el alta al pie. Lo usan los
 * datos generales de un material simple y cada fila de variaciones.
 */
const SupplierPicker = ({
  suppliers,
  value,
  valueName,
  disabled,
  onChange,
  onCreate,
  className,
}: SupplierPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtrados = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const nombre =
    suppliers.find((s) => s.id.toString() === value)?.name ?? valueName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{value ? nombre || "Proveedor" : "Sin proveedor"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar proveedor..." value={search} onValueChange={setSearch} />
          {/* max-h y no h: con altura fija no desborda, y la rueda se la
              lleva el diálogo de detrás. */}
          <CommandList className="max-h-[260px]">
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Sin proveedor
              </CommandItem>
              {filtrados.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={supplier.name}
                  onSelect={() => {
                    onChange(supplier.id.toString());
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === supplier.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {supplier.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {/* Fuera de la lista: fijo y siempre a la vista, que es cuando hace
              falta -- el proveedor no estaba. */}
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 font-normal"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              <UserPlus className="h-4 w-4" />
              Crear proveedor
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/**
 * El formulario del material, compartido por la ficha y por el alta en línea.
 *
 * Mismo reparto que la ficha de producto: un material SIMPLE tiene una sola
 * variación, y su costo y proveedor se escriben en los datos generales; al
 * marcar términos (Color: Negro, Blanco) pasa a tener una variación por
 * combinación, cada una con su código, costo, proveedor y stock.
 */
export const MaterialForm = ({ hook, compact = false }: MaterialFormProps) => {
  const {
    isEditing,
    soloDatosGenerales,
    classes,
    units,
    warehouses,
    stockTypes,
    termGroups,
    selectedTerms,
    toggleTerm,
    hasVariations,
    drafts,
    updateDraft,
    setDraftSupplier,
    selectedStockType,
    setSelectedStockType,
    getStockFor,
    setStockFor,
    suppliers,
    loadingCatalogs,
    form,
    setField,
    classSearch,
    setClassSearch,
    addSupplierOpen,
    setAddSupplierOpen,
    openCreateSupplier,
    supplierCreated,
    images,
    uploadingImages,
    addImages,
    removeImage,
  } = hook;

  /** El input de fichero oculto tras el botón de subir. */
  const imageInputRef = useRef<HTMLInputElement>(null);

  /** El árbol de clases aplanado en el orden en que se pinta, con su nivel. */
  const classTree = useMemo(
    () => flattenMaterialClassTree(buildMaterialClassTree(classes)),
    [classes]
  );

  /**
   * Sin búsqueda, el árbol con su sangría; con búsqueda, la lista plana y cada
   * resultado con su ruta completa, que es el contexto que la sangría ya no da.
   */
  const classOptions = useMemo(() => {
    const query = classSearch.trim().toLowerCase();
    if (query) {
      return classes
        .map((cls) => ({ cls, level: 0, label: materialClassLabel(cls, classes) }))
        .filter((opt) => opt.label.toLowerCase().includes(query))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return classTree.map((node) => ({ cls: node, level: node.level, label: node.name }));
  }, [classes, classSearch, classTree]);

  /** Ninguna clase cuelga de una familia, así que no hay nada que marcar. */
  const sinClasesElegibles = useMemo(
    () => classes.length > 0 && classes.every((c) => !c.parent_class_id),
    [classes]
  );

  const simple = drafts.length === 1 && !hasVariations ? drafts[0] : null;

  /** Aviso suave: un material con el mismo nombre que su clase suele ser una clase mal usada. */
  const claseElegida = classes.find((c) => c.id.toString() === form.material_class_id);
  const nombreIgualClase =
    claseElegida && form.name.trim() !== "" &&
    claseElegida.name.trim().toLowerCase() === form.name.trim().toLowerCase();

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
          placeholder="Ej: Jersey Peinado 30/1"
          autoFocus
        />
        {nombreIgualClase && (
          <p className="text-xs text-muted-foreground">
            Se llama igual que su clase. Si lo que cambia es el color, la talla o
            la medida, usa un nombre general y márcalos en Atributos.
          </p>
        )}
      </div>

      {/* Costo y proveedor de la ÚNICA variación. Con términos, van por
          variación en su propia tarjeta. */}
      {simple && !soloDatosGenerales && (
        <>
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <SupplierPicker
              suppliers={suppliers}
              value={simple.supplierId}
              valueName={simple.supplierName}
              disabled={loadingCatalogs}
              onChange={(id) => setDraftSupplier(simple.key, id)}
              onCreate={() => openCreateSupplier(simple.key)}
            />
          </div>
          <div className="space-y-2">
            <Label>Costo unitario</Label>
            <Input
              type="number"
              step="0.01"
              value={simple.unitCost}
              onChange={(e) => updateDraft(simple.key, { unitCost: e.target.value })}
              placeholder="Ej: 12.50"
            />
          </div>
        </>
      )}
      {soloDatosGenerales && (
        <p className="text-xs text-muted-foreground">
          Este material tiene varias variaciones: su costo y proveedor se editan
          en su ficha.
        </p>
      )}
    </>
  );

  // ------------------------------------------------------------------
  // Atributos: un selector múltiple por grupo, como en la ficha de producto
  // ------------------------------------------------------------------
  const panelAtributos =
    termGroups.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Todavía no hay atributos de materiales. Créalos en{" "}
        <Link to="/suppliers/material-attributes" className="font-medium underline">
          Producción › Catálogos › Atributos de materiales
        </Link>{" "}
        (Color, Largo, Talla…) para distinguir las variaciones de un material.
      </p>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        {termGroups.map((group) => {
          const elegidos = selectedTerms[group.id] ?? [];
          const nombres = group.terms.filter((t) => elegidos.includes(t.id)).map((t) => t.name);
          return (
            <div key={group.id} className="space-y-2">
              <Label>{group.name}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {nombres.length === 0 ? `Seleccionar ${group.name.toLowerCase()}...` : nombres.join(", ")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={`Buscar ${group.name.toLowerCase()}...`} />
                    <CommandList className="max-h-[260px]">
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {group.terms
                          .filter((t) => t.isActive || elegidos.includes(t.id))
                          .map((term) => (
                            <CommandItem
                              key={term.id}
                              value={term.name}
                              onSelect={() => toggleTerm(group.id, term.id)}
                            >
                              <Checkbox className="mr-2" checked={elegidos.includes(term.id)} />
                              {term.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    );

  // ------------------------------------------------------------------
  // Variaciones: código, costo y proveedor de cada combinación
  // ------------------------------------------------------------------
  const tablaVariaciones = (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variación</TableHead>
            <TableHead className="w-32">Código</TableHead>
            <TableHead className="w-36">Costo unit.</TableHead>
            <TableHead className="min-w-[220px]">Proveedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft) => (
            <TableRow key={draft.key}>
              <TableCell className="font-medium">{draft.termsLabel || form.name || "—"}</TableCell>
              <TableCell>
                {draft.code ? (
                  <Badge variant="outline" className="tabular-nums">{draft.code}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Nueva</span>
                )}
              </TableCell>
              <TableCell className="p-2">
                <Input
                  type="number"
                  step="0.01"
                  className="h-8 text-right tabular-nums"
                  value={draft.unitCost}
                  onChange={(e) => updateDraft(draft.key, { unitCost: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  aria-label={`Costo de ${draft.termsLabel}`}
                />
              </TableCell>
              <TableCell className="p-2">
                <SupplierPicker
                  suppliers={suppliers}
                  value={draft.supplierId}
                  valueName={draft.supplierName}
                  disabled={loadingCatalogs}
                  onChange={(id) => setDraftSupplier(draft.key, id)}
                  onCreate={() => openCreateSupplier(draft.key)}
                  className="h-8"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // ------------------------------------------------------------------
  // Clase de material: solo se ELIGE; el catálogo tiene su pantalla
  // ------------------------------------------------------------------
  const panelClases = (
    <>
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
            /* Las raíces --TELA, AVIOS-- son FAMILIAS: van como encabezado, sin
               casilla. Se clasifica en algo que pertenece a ellas. */
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
                {/* Marcar otra SUSTITUYE a la actual: un material tiene una
                    sola clase. */}
                <Checkbox
                  className="shrink-0"
                  id={`clase-material-${cls.id}`}
                  checked={form.material_class_id === cls.id.toString()}
                  onCheckedChange={() =>
                    setField(
                      "material_class_id",
                      form.material_class_id === cls.id.toString() ? "" : cls.id.toString()
                    )
                  }
                />
                {/* min-w-0 para que el truncate corte de verdad y un nombre
                    largo no ensanche el diálogo. */}
                <Label
                  htmlFor={`clase-material-${cls.id}`}
                  className="flex min-w-0 cursor-pointer items-center gap-1 text-sm font-normal"
                  title={label}
                >
                  {level > 0 && <span className="shrink-0 text-xs text-muted-foreground">└</span>}
                  <span className="min-w-0 truncate">{label}</span>
                </Label>
              </div>
            )
          )
        )}
      </div>

      {/* Las clases ya no se crean aquí. Crearlas a mitad de un material era
          como se llenó el árbol de colores y tallas: ahora esos son términos, y
          las clases se cuidan en su propia pantalla. */}
      <p className="mt-3 text-xs text-muted-foreground">
        {!loadingCatalogs && !classSearch.trim() && sinClasesElegibles
          ? "Todavía no hay clases dentro de las familias. "
          : "¿No está la clase? "}
        Créala en{" "}
        <Link to="/suppliers/material-classes" className="font-medium underline">
          Clases de materiales
        </Link>
        . Los colores, tallas y medidas van en Atributos.
      </p>
    </>
  );

  // ------------------------------------------------------------------
  // Unidad de medida
  // ------------------------------------------------------------------
  const selectorUnidad = (
    <Select value={form.measurement_unit} onValueChange={(value) => setField("measurement_unit", value)}>
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
  // Stock: una fila por variación y una columna por almacén, como la
  // pestaña Inventario del producto
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
        <p className="text-xs text-muted-foreground">No hay almacenes activos donde registrar stock.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 min-w-[140px] bg-background">
                    {hasVariations ? "Variación" : "Stock"}
                  </TableHead>
                  {warehouses.map((wh) => (
                    <TableHead key={wh.id} className="min-w-[120px] text-center">
                      {wh.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.key}>
                    <TableCell className="sticky left-0 bg-inherit font-medium">
                      {hasVariations ? draft.termsLabel : "Cantidad"}
                    </TableCell>
                    {warehouses.map((wh) => (
                      <TableCell key={wh.id} className="p-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={getStockFor(draft.key, wh.id) ?? ""}
                          onChange={(e) => setStockFor(draft.key, wh.id, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </>
  );

  /**
   * El alta de proveedor, compartida. Vive fuera de los Popover: montada
   * dentro, cerrar el popover al pulsar «Crear proveedor» se llevaría el modal.
   */
  const modalProveedor = addSupplierOpen && (
    <AddSupplierModal open onOpenChange={setAddSupplierOpen} onCreated={supplierCreated} />
  );

  // ------------------------------------------------------------------
  // Imágenes
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
        {uploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {uploadingImages ? "Subiendo..." : "Seleccionar imágenes"}
      </Button>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square">
              <img src={url} alt="" className="h-full w-full rounded-lg border object-cover" />
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
        <p className="py-4 text-center text-sm text-muted-foreground">No hay imágenes.</p>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        {/* La clase va PRIMERO en el alta en línea: lo primero que se sabe de
            un material a mitad de una receta es qué es, tela o avío. */}
        <div className="space-y-2">
          <Label>Clase de material *</Label>
          <div className="rounded-lg border p-3">{panelClases}</div>
        </div>

        {camposGenerales}

        {isEditing && (
          <p className="text-muted-foreground text-xs">
            Los cambios valen para todas las recetas y órdenes que usen este material.
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
            <CardTitle>Atributos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Lo que distingue a las variaciones de este material. Marca los
              colores, tallas o medidas en que se compra: cada combinación es una
              variación con su propio costo, proveedor y stock.
            </p>
            {panelAtributos}
          </CardContent>
        </Card>

        {hasVariations && (
          <Card>
            <CardHeader>
              <CardTitle>Variaciones ({drafts.length})</CardTitle>
            </CardHeader>
            <CardContent>{tablaVariaciones}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
          </CardHeader>
          <CardContent>{tablaStock}</CardContent>
        </Card>
      </div>

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
