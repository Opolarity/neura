import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Pencil, Plus, Search } from "lucide-react";
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
import { ExplosionMaterialsEditor } from "../components/explosions/ExplosionMaterialsEditor";
import { AddMaterialModal } from "../components/materials/AddMaterialModal";
import { ItemProductDialog } from "../components/production-orders/ItemProductDialog";
import { ProductVariationSelector } from "@/shared/components/product-variation-selector";

const ExplosionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
   * El alta de prenda desde la receta.
   *
   * Es el MISMO diálogo de la orden de producción: busca una variación, crea
   * el producto entero, o le añade una talla a uno que ya existe. Aquí hacía
   * falta por lo mismo que allí — al armar la receta el producto puede no
   * estar creado todavía, y salir a Productos y volver era el único motivo
   * para abandonarla a medias.
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
    addVariations,
    pickVariation,
    pickingVariation,
    removeVariation,
    lines,
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
  } = useExplosionDetail({ idParam: id });

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
          aria-label="Volver a Desarrollo de Producto"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Nueva receta de producto" : `Receta de producto #${id}`}
          </h1>
          {!isNew && !editing && (
            <Button
              variant="outline"
              className="ml-auto gap-2"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {/* En el alta no: una receta sin guardar no tiene número con el que
              encabezar el papel.

              Este papel es la RECETA -- lo que consume una prenda -- y no el
              requerimiento, que solo existe cuando una orden dice cuántas
              prendas son. El requerimiento vive en la orden de producción. */}
          {!isNew && (
            <Button
              variant="outline"
              className={editing ? "ml-auto gap-2" : "gap-2"}
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

          {/* Las prendas son opcionales: una receta puede escribirse antes de
              saber a qué va, y las anteriores a este campo no tienen ninguna.
              Y pueden ser varias — la misma receta suele valer para las tres
              tallas de la prenda. */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Prendas</Label>

            {variations.length > 0 && (
              <div className="flex flex-col gap-2">
                {variations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{v.label}</span>
                      {v.sku && (
                        <span className="text-xs text-muted-foreground">
                          {v.sku}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariation(v.id)}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <div className="flex gap-2">
                {/* El mismo buscador que el pop-up de «crear prenda» en su
                    modo «ya existe», sin stock: la prenda no se elige por lo
                    que hay en almacén. Cada elección se suma a la lista. */}
                <div className="flex-1">
                  <ProductVariationSelector
                    showStock={false}
                    onSelect={(picked) => pickVariation(picked.id)}
                    trigger={
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start overflow-hidden font-normal"
                        disabled={pickingVariation}
                      >
                        {pickingVariation ? (
                          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <Search className="mr-2 h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">Buscar por nombre o SKU...</span>
                      </Button>
                    }
                  />
                </div>
                {/* El buscador es el camino rápido cuando la prenda existe;
                    esto es para cuando no. */}
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Crear prenda
                </Button>
              </div>
            )}

            {variations.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sin prendas asignadas. Es válido: la receta queda como genérica.
              </p>
            )}
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

      {/* Se monta al abrir, como el alta de material: así nace limpio y no
          arrastra lo tecleado en un intento anterior que se canceló. */}
      {productDialogOpen && (
        <ItemProductDialog
          open
          onOpenChange={setProductDialogOpen}
          onSelected={addVariations}
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

      {/* Leyendo no hay barra: sin cambios que descartar «Cancelar» no
          significaría nada, un «Guardar» ahí invitaría a tocar, y para volver
          está la flecha del título. */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={
              isNew ? () => navigate("/suppliers/explosions") : cancelEditing
            }
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isNew ? (
              "Guardar receta"
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExplosionDetail;
