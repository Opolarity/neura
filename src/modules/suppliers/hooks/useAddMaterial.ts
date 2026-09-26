import { useState, useEffect, useMemo } from "react";
import {
  classesByModuleCode,
  getWarehousesIsActiveTrue,
} from "@/shared/services/service";
import { Class } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  Material,
  MaterialClass,
  MaterialStockEntry,
  MeasurementUnit,
  SupplierOption,
} from "../types/materials.types";
import {
  materialClassesApi,
  measurementUnitsApi,
  removeMaterialImageApi,
  saveMaterialApi,
  supplierOptionsApi,
  uploadMaterialImageApi,
} from "../services/materials.service";
import { materialTermsApi } from "../services/materialTerms.service";
import { MaterialTermGroup } from "../types/materialTerms.types";
import { MaterialOption } from "../types/services.types";

interface UseAddMaterialOptions {
  /** Material a editar. Si no se pasa, el formulario funciona en modo creación. */
  material?: Material | null;
  /**
   * Se ejecuta tras crear o actualizar el material, y recibe cómo quedó, con
   * su id. Quien abrió el formulario desde otra pantalla -- una línea de
   * receta, por ejemplo -- lo necesita para refrescar lo que ya tenía pintado.
   */
  onSuccess?: (created?: MaterialOption) => void;
  /**
   * Alta en línea (receta, orden): sin atributos ni stock. Si el material ya
   * tiene varias variaciones, desde ahí solo se tocan sus datos generales.
   */
  compact?: boolean;
}

/**
 * Una variación mientras se edita la ficha.
 *
 * `key` son sus términos ordenados ("12,40"; "" en un material simple): es lo
 * que la identifica al regenerar las combinaciones, para que marcar un color
 * más no borre el costo ni el stock ya escritos en los otros.
 */
export interface VariationDraft {
  key: string;
  /** Null en las que todavía no existen. */
  id: number | null;
  termIds: number[];
  /** Solo los términos ("Negro · 14 cm"); vacío en un material simple. */
  termsLabel: string;
  code: string;
  unitCost: string;
  supplierId: string;
  supplierName: string;
  /** El saldo que ya tiene, por almacén y tipo. */
  stockBase: MaterialStockEntry[];
  /** Lo tecleado: el saldo que debe QUEDAR. Vacío = no tocar. */
  stockEdits: MaterialStockEntry[];
}

const emptyForm = {
  name: "",
  material_class_id: "",
  measurement_unit: "",
};

const keyOf = (termIds: number[]) => [...termIds].sort((a, b) => a - b).join(",");

/** Producto cartesiano de los términos elegidos, un grupo tras otro. */
const combinations = (groups: number[][]): number[][] =>
  groups.reduce<number[][]>(
    (acc, terms) => acc.flatMap((combo) => terms.map((t) => [...combo, t])),
    [[]]
  );

const draftFromVariation = (v: Material["variations"][number]): VariationDraft => ({
  key: keyOf(v.terms.map((t) => t.id)),
  id: v.id,
  termIds: v.terms.map((t) => t.id),
  termsLabel: v.termsLabel ?? "",
  code: v.code,
  unitCost: v.unitCost === null ? "" : String(v.unitCost),
  supplierId: v.supplierId === null ? "" : String(v.supplierId),
  supplierName: v.supplierName ?? "",
  stockBase: v.stockEntries,
  stockEdits: [],
});

const emptyDraft = (termIds: number[], termsLabel: string): VariationDraft => ({
  key: keyOf(termIds),
  id: null,
  termIds,
  termsLabel,
  code: "",
  unitCost: "",
  supplierId: "",
  supplierName: "",
  stockBase: [],
  stockEdits: [],
});

export const useAddMaterial = ({
  material = null,
  onSuccess,
  compact = false,
}: UseAddMaterialOptions = {}) => {
  const isEditing = Boolean(material);

  const [classes, setClasses] = useState<MaterialClass[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  /** Alta de proveedor en línea; `supplierFor` dice para qué variación. */
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierFor, setSupplierFor] = useState<string>("");
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockTypes, setStockTypes] = useState<Class[]>([]);
  const [termGroups, setTermGroups] = useState<MaterialTermGroup[]>([]);
  /** El tipo de inventario que se está editando, como en la pantalla de producto. */
  const [selectedStockType, setSelectedStockType] = useState<number | null>(null);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Los términos marcados, por grupo: Color → [Negro, Blanco]. */
  const [selectedTerms, setSelectedTerms] = useState<Record<number, number[]>>({});
  const [drafts, setDrafts] = useState<VariationDraft[]>([emptyDraft([], "")]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [materialClasses, supplierList, unitList, warehouseList, stockTypeList, terms] =
          await Promise.all([
            materialClassesApi(),
            supplierOptionsApi(),
            measurementUnitsApi(),
            getWarehousesIsActiveTrue(),
            // Los tipos de stock son los mismos que usan los productos.
            classesByModuleCode("STK"),
            materialTermsApi(),
          ]);
        setClasses(materialClasses);
        setSuppliers(supplierList);
        setUnits(unitList);
        setWarehouses(warehouseList);
        setStockTypes(stockTypeList);
        setTermGroups(terms.filter((g) => g.isActive && g.terms.some((t) => t.isActive)));

        const porDefecto =
          stockTypeList.find((t) => t.code === "PRD") ?? stockTypeList[0];
        if (porDefecto) setSelectedStockType(porDefecto.id);
      } catch (error) {
        toastError(error, "Error al cargar datos iniciales");
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  /**
   * El material puede llegar DESPUÉS del montaje: en la ficha se carga por id
   * y en el primer render es null.
   */
  useEffect(() => {
    if (!material) {
      setForm(emptyForm);
      setImages([]);
      setSelectedTerms({});
      setDrafts([emptyDraft([], "")]);
      return;
    }
    setForm({
      name: material.name,
      material_class_id: material.materialClassId.toString(),
      measurement_unit: material.measurementUnit,
    });
    setImages(material.images ?? []);

    const activas = material.variations.filter((v) => v.isActive);
    const porGrupo: Record<number, number[]> = {};
    activas.forEach((v) =>
      v.terms.forEach((t) => {
        porGrupo[t.groupId] = porGrupo[t.groupId] ?? [];
        if (!porGrupo[t.groupId].includes(t.id)) porGrupo[t.groupId].push(t.id);
      })
    );
    setSelectedTerms(porGrupo);
    setDrafts(activas.length > 0 ? activas.map(draftFromVariation) : [emptyDraft([], "")]);
  }, [material?.id]);

  /** Nombre de cada término, para las etiquetas de las combinaciones. */
  const termName = useMemo(() => {
    const map = new Map<number, { name: string; groupName: string }>();
    termGroups.forEach((g) => g.terms.forEach((t) => map.set(t.id, { name: t.name, groupName: g.name })));
    material?.variations.forEach((v) =>
      v.terms.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, { name: t.name, groupName: t.groupName });
      })
    );
    return map;
  }, [termGroups, material]);

  /**
   * Marcar o desmarcar un término regenera las combinaciones. Las que ya
   * existían se conservan con lo escrito; las nuevas heredan el costo y el
   * proveedor de la primera, que suele ser el mismo para todos los colores.
   */
  const toggleTerm = (groupId: number, termId: number) => {
    const actual = selectedTerms[groupId] ?? [];
    const siguiente = actual.includes(termId)
      ? actual.filter((id) => id !== termId)
      : [...actual, termId];
    const nuevos = { ...selectedTerms, [groupId]: siguiente };
    if (siguiente.length === 0) delete nuevos[groupId];
    setSelectedTerms(nuevos);

    // En el orden de los grupos del catálogo, para que las etiquetas salgan
    // siempre igual: "Negro · 14 cm", nunca "14 cm · Negro".
    const grupos = termGroups
      .filter((g) => (nuevos[g.id] ?? []).length > 0)
      .map((g) => nuevos[g.id]);
    const combos = grupos.length === 0 ? [[]] : combinations(grupos);

    setDrafts((prev) => {
      const porKey = new Map(prev.map((d) => [d.key, d]));
      const molde = prev[0];
      return combos.map((termIds) => {
        const existente = porKey.get(keyOf(termIds));
        if (existente) return existente;
        const etiqueta = termIds.map((id) => termName.get(id)?.name ?? "").join(" · ");
        return {
          ...emptyDraft(termIds, etiqueta),
          unitCost: molde?.unitCost ?? "",
          supplierId: molde?.supplierId ?? "",
          supplierName: molde?.supplierName ?? "",
        };
      });
    });
  };

  const hasVariations = Object.keys(selectedTerms).length > 0;

  const setField = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateDraft = (key: string, change: Partial<VariationDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...change } : d)));

  const setDraftSupplier = (key: string, supplierId: string) =>
    updateDraft(key, {
      supplierId,
      supplierName: suppliers.find((s) => s.id.toString() === supplierId)?.name ?? "",
    });

  // ---- Stock por variación, almacén y tipo --------------------------------

  const getStockFor = (key: string, warehouseId: number): number | undefined => {
    const draft = drafts.find((d) => d.key === key);
    if (!draft) return undefined;
    const tecleado = draft.stockEdits.find(
      (e) => e.warehouseId === warehouseId && e.stockTypeId === selectedStockType
    );
    if (tecleado) return tecleado.stock;
    return draft.stockBase
      .filter((e) => e.warehouseId === warehouseId && e.stockTypeId === selectedStockType)
      .reduce<number | undefined>((suma, e) => (suma ?? 0) + (e.stock ?? 0), undefined);
  };

  const setStockFor = (key: string, warehouseId: number, value: string) => {
    if (selectedStockType === null) return;
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const resto = d.stockEdits.filter(
          (e) => !(e.warehouseId === warehouseId && e.stockTypeId === selectedStockType)
        );
        // Vaciar la celda NO es poner cero: es no tocar ese almacén.
        return value === ""
          ? { ...d, stockEdits: resto }
          : {
              ...d,
              stockEdits: [
                ...resto,
                { warehouseId, stockTypeId: selectedStockType, stock: Number(value) },
              ],
            };
      })
    );
  };

  // ---- Imágenes -------------------------------------------------------------

  const addImages = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const subidas: string[] = [];
      let fallidas = 0;
      for (const file of files) {
        try {
          subidas.push(await uploadMaterialImageApi(file));
        } catch (error) {
          console.error("Error uploading material image:", error);
          fallidas += 1;
        }
      }
      if (subidas.length > 0) setImages((prev) => [...prev, ...subidas]);
      if (fallidas > 0) {
        toast({
          title:
            fallidas === 1
              ? "Una imagen no se pudo subir"
              : `${fallidas} imágenes no se pudieron subir`,
          variant: "destructive",
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((image) => image !== url));
    void removeMaterialImageApi(url);
  };

  // ---- Guardar --------------------------------------------------------------

  /**
   * Desde el alta en línea no se tocan las variaciones de un material que ya
   * tiene varias: ahí no se ven, y mandarlas sería decidir sobre algo oculto.
   */
  const soloDatosGenerales =
    compact && (material?.variations.filter((v) => v.isActive).length ?? 0) > 1;

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.material_class_id) {
      toast({ title: "La clase de material es obligatoria", variant: "destructive" });
      return;
    }
    const claseElegida = classes.find((c) => c.id.toString() === form.material_class_id);
    if (claseElegida && !claseElegida.parent_class_id) {
      toast({
        title: `«${claseElegida.name}» es una familia, no una clase`,
        description: "Elige una clase concreta de las que cuelgan de ella.",
        variant: "destructive",
      });
      return;
    }
    if (!form.measurement_unit) {
      toast({ title: "La unidad de medida es obligatoria", variant: "destructive" });
      return;
    }
    if (drafts.some((d) => d.unitCost !== "" && isNaN(Number(d.unitCost)))) {
      toast({ title: "El costo unitario debe ser numérico", variant: "destructive" });
      return;
    }
    if (drafts.some((d) => d.stockEdits.some((e) => e.stock !== undefined && isNaN(e.stock)))) {
      toast({ title: "Hay cantidades de stock no numéricas", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const guardado = await saveMaterialApi({
        material: {
          id: material?.id,
          name: form.name.trim(),
          material_class_id: Number(form.material_class_id),
          measurement_unit: form.measurement_unit,
          images,
        },
        variations: soloDatosGenerales
          ? null
          : drafts.map((d) => ({
              id: d.id,
              term_ids: d.termIds,
              unit_cost: d.unitCost === "" ? null : Number(d.unitCost),
              // Sin proveedor es válido: el insumo existe en la receta antes
              // de decidir a quién se le compra.
              supplier_id: d.supplierId === "" ? null : Number(d.supplierId),
              stock: d.stockEdits
                .filter((e) => e.stock !== undefined)
                .map((e) => ({
                  warehouse_id: e.warehouseId,
                  stock_type_id: e.stockTypeId,
                  quantity: e.stock as number,
                })),
            })),
      });

      toast({
        title: isEditing ? "Material actualizado exitosamente" : "Material creado exitosamente",
        variant: "success",
      });
      const clase = classes.find((c) => c.id.toString() === form.material_class_id);
      onSuccess?.({
        id: guardado.id,
        name: form.name.trim(),
        unitCost: drafts[0]?.unitCost ? Number(drafts[0].unitCost) : null,
        measurementUnit: form.measurement_unit,
        materialClassId: clase?.id ?? null,
        materialClassName: clase?.name ?? null,
      });
    } catch (error) {
      toastError(error, isEditing ? "Error al actualizar material" : "Error al crear material");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Un proveedor recién creado desde aquí se asigna solo a la variación desde
   * la que se pidió: si hubo que crearlo, es el de ella.
   */
  const openCreateSupplier = (key: string) => {
    setSupplierFor(key);
    setAddSupplierOpen(true);
  };

  const supplierCreated = async (supplierId: number) => {
    setAddSupplierOpen(false);
    let lista = suppliers;
    try {
      lista = await supplierOptionsApi();
      setSuppliers(lista);
    } catch (error) {
      console.error(error);
    }
    updateDraft(supplierFor, {
      supplierId: String(supplierId),
      supplierName: lista.find((s) => s.id === supplierId)?.name ?? "",
    });
  };

  return {
    isEditing,
    compact,
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
    submitting,
    handleSubmit,
  };
};
