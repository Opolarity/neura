import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Package, Save, SquarePen, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/shared/components/page-loader";
import { toast } from "@/shared/hooks/use-toast";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import { openRecipePdf } from "../utils/recipePdf";
import { materialByIdApi } from "../services/materials.service";
import { Material } from "../types/materials.types";
import { useExplosionDetail } from "../hooks/useExplosionDetail";
import { ExplosionProcessesDialog } from "../components/explosions/ExplosionProcessesDialog";
import { ExplosionMaterialsEditor } from "../components/explosions/ExplosionMaterialsEditor";
import { AddMaterialModal } from "../components/materials/AddMaterialModal";
import { ItemProductDialog } from "../components/production-orders/ItemProductDialog";

const ExplosionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [printing, setPrinting] = useState(false);
  /**
   * El material que se está editando, ya cargado.
   *
   * La línea solo tiene la opción del catálogo -- nombre, clase, unidad y
   * costo -- y el formulario pide más, así que la ficha completa se trae por
   * id. El modal ya contempla que llegue después del montaje, que es la misma
   * vía por la que la carga la ficha del material.
   */
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  /**
   * Elegir (o crear) el producto de la receta.
   *
   * Es el MISMO diálogo de la orden de producción. Solo hace falta cuando la
   * receta llega sin producto: desde "Recetas" ya viene con él.
   */
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  /**
   * Una receta existente se abre para LEER. Entrar y poder añadir materiales
   * sin más convierte cada consulta en un cambio a un clic de distancia, y una
   * receta la usan las órdenes de producción: tocarla de paso cambia lo que se
   * está fabricando.
   *
   * En el alta no hay nada que leer todavía, así que nace en edición.
   */
  const [editing, setEditing] = useState(false);
  /** La ruta se edita en su propio modal, no en la ficha. */
  const [processesDialogOpen, setProcessesDialogOpen] = useState(false);

  const {
    createdAt,
    reload,
    isNew,
    loading,
    submitting,
    materials,
    description,
    modelCode,
    setModelCode,
    variations,
    product,
    pickProduct,
    pickingProduct,
    unify,
    unifying,
    handleUnify,
    lines,
    processes,
    processGroups,
    operationCatalog,
    addProcess,
    removeProcess,
    moveProcess,
    addOperation,
    removeOperation,
    replaceOperation,
    clearOperations,
    createOperation,
    creatingOperation,
    addLine,
    removeLine,
    setLineMaterial,
    creatingMaterialFor,
    setCreatingMaterialFor,
    materialCreated,
    editingMaterialId,
    setEditingMaterialId,
    materialUpdated,
    setLineQuantity,
    setLineVariationQuantity,
    materialSearch,
    setMaterialSearch,
    previewTotal,
    handleSubmit,
  } = useExplosionDetail({ idParam: id, productParam: searchParams.get("product") });

  // La ficha del material que se va a editar. Se descarta al cerrar para que
  // la siguiente edición no abra con los datos del material anterior.
  useEffect(() => {
    if (editingMaterialId === null) {
      setEditingMaterial(null);
      return;
    }

    let cancelado = false;
    materialByIdApi(editingMaterialId)
      .then((material) => {
        if (!cancelado) setEditingMaterial(material);
      })
      .catch(() => {
        if (cancelado) return;
        toast({
          title: "No se pudo cargar el material",
          variant: "destructive",
        });
        setEditingMaterialId(null);
      });

    return () => {
      cancelado = true;
    };
    // setEditingMaterialId viene del hook y es estable entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMaterialId]);

  /**
   * Se imprime lo que hay en pantalla, no lo guardado: si se acaba de añadir
   * un material y todavía no se guardó, un papel con la receta anterior sería
   * una mentira silenciosa. La clase y el costo de cada línea ya viajan con el
   * material desde que se elige.
   */
  const handlePrint = async () => {
    try {
      setPrinting(true);
      const company = await getCompanyDocumentHeader();

      openRecipePdf({
        explosionId: Number(id),
        description,
        modelCode,
        variationLabel: variations.map((v) => v.label).join(" · ") || null,
        createdAt,
        company,
        materials: lines
          // Una línea recién añadida y sin material todavía no es nada que
          // imprimir.
          .filter((line) => line.materialId > 0)
          .map((line) => ({
            name: line.materialName,
            className: line.materialClassName,
            unitConsumption: line.quantity,
            measurementUnit: line.measurementUnit,
            unitCost: line.unitCost,
            lineTotal: (line.quantity ?? 0) * (line.unitCost ?? 0),
            // Las excepciones «Por prenda», con el nombre de la prenda tal
            // como lo enseña la ficha. Una excepción de una prenda que ya se
            // quitó de la receta no se imprime: no hay a quién atribuirla.
            variations: line.variations.flatMap((exception) => {
              const prenda = variations.find((v) => v.id === exception.variationId);
              return prenda
                ? [{ label: prenda.label || `#${prenda.id}`, quantity: exception.quantity }]
                : [];
            }),
          })),
        total: previewTotal,
      });
    } catch (error: any) {
      toast({
        title: "No se pudo generar el requerimiento: " + error.message,
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return <PageLoader message="Cargando la receta..." />;
  }

  const canEdit = isNew || editing;

  /**
   * Lo que se lee sin abrir el modal: los procesos en orden y cuántas
   * operaciones cuelgan de cada uno. "Corte (2 operaciones) → Confección".
   */
  const resumenProcesos =
    processes.length === 0
      ? "Sin procesos"
      : processes
          .map((paso) => {
            const nombre = paso.processGroupName ?? "Proceso";
            if (paso.operations.length === 0) return nombre;
            return `${nombre} (${paso.operations.length} ${
              paso.operations.length === 1 ? "operación" : "operaciones"
            })`;
          })
          .join(" → ");

  /** Cancelar no solo sale del modo edición: descarta lo tecleado. */
  const cancelEditing = async () => {
    setEditing(false);
    await reload();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/suppliers/explosions")}
          aria-label="Volver a Recetas"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Nueva receta de producto" : `Receta de producto #${id}`}
          </h1>
          {/* La ruta del molde. Se abre leyendo o editando: en lectura es
              para consultarla, y el propio modal trae su botón de editar. */}
          <Button
            variant="outline"
            className="ml-auto gap-2"
            onClick={() => setProcessesDialogOpen(true)}
          >
            <Workflow className="h-4 w-4" />
            Vincular procesos
          </Button>
          {/* En el alta no: una receta sin guardar no tiene número con el que
              encabezar el papel.

              Este papel es la RECETA -- lo que consume una prenda -- y no el
              requerimiento, que solo existe cuando una orden dice cuántas
              prendas son. El requerimiento vive en la orden de producción. */}
          {!isNew && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handlePrint}
              disabled={printing}
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Imprimir receta
            </Button>
          )}
          {/* La acción principal, al final y en morado: leyendo es «Editar», y
              al editar el MISMO sitio pasa a «Guardar», con «Cancelar» al lado
              para descartar. Así no hay que bajar al final de la ficha para
              guardar. */}
          {canEdit ? (
            <>
              <Button
                variant="outline"
                onClick={
                  isNew ? () => navigate("/suppliers/explosions") : cancelEditing
                }
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <Button className="gap-2" onClick={() => setEditing(true)}>
              <SquarePen className="h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Sin campo de descripción: desde que la receta se vincula a prendas,
          escribirle además un nombre era pedir dos veces lo mismo. La columna
          sigue existiendo y es lo que se ve en el listado y en el PDF, pero la
          compone el backend con las prendas (fn_explosion_description). */}
      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          {/* El código del molde. Vive en la receta porque es la receta la que
              se amarra a las prendas, y el molde va con ella. */}
          <div className="space-y-2">
            <Label htmlFor="explosion-model-code">Código de modelo</Label>
            <Input
              id="explosion-model-code"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              placeholder="Ej: MOD-2026-014"
              disabled={!canEdit}
            />
          </div>

          {/* El PRODUCTO, no prendas sueltas: una receta por producto, que cubre
              todas sus variaciones. Lo que cambia por prenda se ajusta en los
              materiales (la excepción por prenda), no con otra receta. */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Producto</Label>

            {product ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{product.title}</span>
                  <Badge variant="secondary">
                    Aplica a {variations.length === 1 ? "su única variación" : `sus ${variations.length} variaciones`}
                  </Badge>
                </div>
                {variations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {variations.map((v) => (
                      <Badge key={v.id} variant="outline" title={v.sku ?? undefined}>
                        {v.label || v.sku || `#${v.id}`}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Si una talla lleva otra cantidad de algún material, se indica en esa
                  línea de materiales como excepción por prenda.
                </p>
              </div>
            ) : unify ? (
              /* Receta antigua: hay que elegir cuál queda como la del producto. */
              <div className="space-y-2 rounded-lg bg-warning-soft p-3 text-warning-soft-foreground">
                <p className="text-sm">
                  Esta receta es anterior a la regla de «una receta por producto» y
                  todavía no tiene producto.
                  {unify.hasRecipe
                    ? ` ${unify.productTitle ?? "Su producto"} ya tiene su receta: esta queda solo como histórica para las órdenes que la usan.`
                    : unify.competitors.length > 0
                      ? ` Compite con ${unify.competitors.map((c) => `#${c}`).join(", ")} por ${unify.productTitle ?? "el producto"}: elige cuál queda.`
                      : ` Pertenece a ${unify.productTitle ?? "un producto"}.`}
                </p>
                {!unify.hasRecipe && (
                  <Button size="sm" onClick={handleUnify} disabled={unifying} className="gap-2">
                    {unifying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Usar esta como receta de {unify.productTitle ?? "el producto"}
                  </Button>
                )}
                {variations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {variations.map((v) => (
                      <Badge key={v.id} variant="outline">
                        {v.label || v.sku || `#${v.id}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {isNew
                    ? "Elige el producto de esta receta: cubrirá todas sus variaciones."
                    : "Receta genérica, sin producto."}
                </span>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setProductDialogOpen(true)}
                    disabled={pickingProduct}
                  >
                    {pickingProduct ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                    Elegir producto
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Solo el resumen: por dónde pasa el molde se lee aquí sin abrir
              nada, y se toca desde el botón del header. Esta pantalla es la de
              los MATERIALES, y un editor de ruta entero dentro tapaba de qué
              está hecha la prenda. */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Procesos</Label>
            <div className="rounded-lg border border-border p-3">
              <span className="text-sm" title={resumenProcesos}>
                {resumenProcesos}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ExplosionMaterialsEditor
            lines={lines}
            materials={materials}
            search={materialSearch}
            onSearchChange={setMaterialSearch}
            onAddLine={addLine}
            onRemoveLine={removeLine}
            onSelectMaterial={setLineMaterial}
            onCreateMaterial={setCreatingMaterialFor}
            onEditMaterial={setEditingMaterialId}
            onChangeQuantity={setLineQuantity}
            variations={variations}
            onChangeVariationQuantity={setLineVariationQuantity}
            previewTotal={previewTotal}
            readOnly={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Se monta al abrir, como los demás: los buscadores de dentro nacen
          limpios. */}
      {processesDialogOpen && (
        <ExplosionProcessesDialog
          open
          onOpenChange={setProcessesDialogOpen}
          processes={processes}
          processGroups={processGroups}
          operationCatalog={operationCatalog}
          onAdd={addProcess}
          onRemove={removeProcess}
          onMove={moveProcess}
          onAddOperation={addOperation}
          onRemoveOperation={removeOperation}
          onReplaceOperation={replaceOperation}
          onClearOperations={clearOperations}
          onCreateOperation={createOperation}
          creatingOperation={creatingOperation}
          readOnly={!canEdit}
          // El mismo `setEditing` del lápiz: se edita la receta entera, que es
          // lo que se guarda. La ruta no se guarda por su cuenta.
          onEdit={() => setEditing(true)}
        />
      )}

      {/* Se monta al abrir, como el alta de material: así nace limpio y no
          arrastra lo tecleado en un intento anterior que se canceló. */}
      {productDialogOpen && (
        <ItemProductDialog
          open
          onOpenChange={setProductDialogOpen}
          onSelected={(elegidas) => {
            setProductDialogOpen(false);
            const productId = elegidas[0]?.productId ?? null;
            if (productId === null) {
              toast({ title: "No se pudo identificar el producto", variant: "destructive" });
              return;
            }
            pickProduct(productId);
          }}
        />
      )}

      {/* Se monta al abrir: así el formulario nace limpio cada vez, sin
          arrastrar lo tecleado en un alta anterior que se canceló. */}
      {creatingMaterialFor !== null && (
        <AddMaterialModal
          open
          onOpenChange={(value) => {
            if (!value) setCreatingMaterialFor(null);
          }}
          onSaved={(created) => {
            if (created) materialCreated(created);
          }}
        />
      )}

      {/* Editar el material de una línea. Se espera a tenerlo cargado: montar
          el modal vacío enseñaría un formulario en blanco que se rellena solo
          un instante después, y se puede teclear encima de lo que va a llegar. */}
      {editingMaterialId !== null && editingMaterial && (
        <AddMaterialModal
          open
          material={editingMaterial}
          onOpenChange={(value) => {
            if (!value) setEditingMaterialId(null);
          }}
          onSaved={(updated) => {
            if (updated) materialUpdated(updated);
            else setEditingMaterialId(null);
          }}
        />
      )}

    </div>
  );
};

export default ExplosionDetail;
