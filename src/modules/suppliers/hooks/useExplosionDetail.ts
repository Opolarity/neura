import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  variationByIdApi,
  VariationOption,
} from "../services/productionOrders.service";
import {
  ExplosionMaterial,
} from "../types/explosions.types";
import { MaterialOption } from "../types/services.types";
import {
  createExplosionApi,
  explosionByIdApi,
  updateExplosionApi,
} from "../services/explosions.service";
import { materialOptionsApi } from "../services/supplierServices.service";

interface UseExplosionDetailOptions {
  /** `undefined` o "new" abren el formulario en modo creación. */
  idParam?: string;
}

/** Línea vacía que se añade al pulsar "Añadir material". */
const emptyLine = (): ExplosionMaterial => ({
  materialId: 0,
  materialName: "",
  materialClassId: null,
  materialClassName: null,
  measurementUnit: null,
  unitCost: null,
  quantity: null,
  lineTotal: 0,
  variations: [],
});

export const useExplosionDetail = ({ idParam }: UseExplosionDetailOptions) => {
  const navigate = useNavigate();
  const isNew = !idParam || idParam === "new";
  const explosionId = isNew ? null : Number(idParam);

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);

  /** Cuándo se registró la receta. Solo se lee: lo pone el backend al crear. */
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  /** Línea desde la que se abrió el alta de material, o null. */
  const [creatingMaterialFor, setCreatingMaterialFor] = useState<number | null>(
    null
  );
  /**
   * Material que se está editando desde una línea, o null.
   *
   * Guarda el ID del material y no el índice de la línea, al revés que el
   * alta: lo que se edita es el material del catálogo, y al volver hay que
   * refrescar TODAS las líneas que lo usen, no solo aquella desde la que se
   * abrió.
   */
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(
    null
  );

  /**
   * Como se llama la receta. Solo se LEE: la compone el backend con sus
   * prendas. Sigue haciendo falta porque es lo que sale en el PDF.
   */
  const [description, setDescription] = useState("");
  /** Código del molde. Texto libre; se guarda tal cual. */
  const [modelCode, setModelCode] = useState("");
  const [lines, setLines] = useState<ExplosionMaterial[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);

  // Las prendas que cubre la receta. Se buscan con el mismo selector
  // compartido que usa el pop-up de «crear prenda», para que la prenda se
  // busque igual en los dos sitios.
  const [variations, setVariations] = useState<VariationOption[]>([]);
  /** Se está hidratando la prenda recién elegida en el selector. */
  const [pickingVariation, setPickingVariation] = useState(false);

  const [materialSearch, setMaterialSearch] = useState("");
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);

  // Catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setMaterials(await materialOptionsApi());
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      }
    };
    loadCatalogs();
  }, []);

  // Búsqueda de materiales en servidor: pueden ser miles.
  useEffect(() => {
    if (debouncedMaterialSearch === "") return;

    materialOptionsApi(debouncedMaterialSearch)
      .then(setMaterials)
      .catch(() => toast({ title: "Error al buscar materiales", variant: "destructive" }));
  }, [debouncedMaterialSearch]);

  const loadExplosion = useCallback(async () => {
    if (explosionId === null) return;

    try {
      setLoading(true);
      const detail = await explosionByIdApi(explosionId);
      setDescription(detail.description);
      setModelCode(detail.modelCode ?? "");
      setLines(detail.materials);
      setSavedTotal(detail.total);
      setCreatedAt(detail.createdAt);
      setVariations(
        detail.variations.map((v) => ({
          id: v.variationId,
          sku: v.variationSku,
          productTitle: v.productTitle ?? "",
          label: v.variationLabel ?? "",
          // El detalle trae las categorias de TODOS sus productos juntas, no
          // por prenda, asi que aqui no se pueden repartir. La ficha las
          // muestra aparte.
          categories: [],
          categoryIds: [],
          tags: [],
          tagIds: [],
          productId: v.productId,
        })),
      );
    } catch (error: any) {
      toast({ title: "Error al cargar la explosión: " + error.message, variant: "destructive" });
      navigate("/suppliers/explosions");
    } finally {
      setLoading(false);
    }
  }, [explosionId, navigate]);

  useEffect(() => {
    loadExplosion();
  }, [loadExplosion]);

  const addVariation = (option: VariationOption) => addVariations([option]);

  /** Varias de golpe: el diálogo creó S, M, L y XL en una sola pasada. */
  const addVariations = (options: VariationOption[]) =>
    setVariations((prev) =>
      // Vincular dos veces la misma prenda no significa nada, y el UNIQUE de
      // la puente lo rechazaria igualmente.
      [...prev, ...options.filter((o) => !prev.some((v) => v.id === o.id))],
    );

  /**
   * Lo elegido en el selector compartido. Ese selector solo da id y título,
   * así que la prenda se relee entera -- SKU, etiqueta, clasificación -- que
   * es lo que la lista muestra y lo que viaja al guardar.
   */
  const pickVariation = async (variationId: number) => {
    setPickingVariation(true);
    try {
      const full = await variationByIdApi(variationId);
      if (!full) {
        toast({ title: "No se encontró esa prenda", variant: "destructive" });
        return;
      }
      addVariation(full);
    } catch (error: any) {
      toast({
        title: "Error al cargar la prenda: " + error.message,
        variant: "destructive",
      });
    } finally {
      setPickingVariation(false);
    }
  };

  const removeVariation = (variationId: number) =>
    setVariations((prev) => prev.filter((v) => v.id !== variationId));

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  // Se copian unitCost y measurementUnit del material para poder calcular
  // el total en vivo sin volver a consultar al backend.
  /**
   * Un material recién creado desde una línea: se suma a la lista y se asigna
   * a esa línea. No se recarga el catálogo entero -- el alta ya devuelve la
   * fila con su id, y recargar perdería el término de búsqueda tecleado.
   */
  const materialCreated = (material: MaterialOption) => {
    setMaterials((prev) =>
      prev.some((m) => m.id === material.id) ? prev : [...prev, material]
    );
    if (creatingMaterialFor !== null) {
      setLineMaterial(creatingMaterialFor, material);
    }
    setCreatingMaterialFor(null);
  };

  /**
   * Lo que una línea toma del material. Extraído porque lo escriben dos rutas
   * -- elegir material y volver de editarlo -- y si divergen, una de las dos
   * deja la línea con datos viejos.
   */
  const applyMaterial = (
    line: ExplosionMaterial,
    material: MaterialOption
  ): ExplosionMaterial => ({
    ...line,
    materialId: material.id,
    materialName: material.name,
    materialClassId: material.materialClassId,
    materialClassName: material.materialClassName,
    unitCost: material.unitCost,
    measurementUnit: material.measurementUnit,
  });

  const setLineMaterial = (index: number, material: MaterialOption) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? applyMaterial(line, material) : line))
    );
  };

  /**
   * Vuelta de editar un material: se refresca en el catálogo y en cada línea
   * que lo use. Sin recargar nada -- el guardado ya sabe con qué valores se
   * quedó, y recargar perdería el término de búsqueda tecleado.
   */
  const materialUpdated = (material: MaterialOption) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === material.id ? material : m))
    );
    setLines((prev) =>
      prev.map((line) =>
        line.materialId === material.id ? applyMaterial(line, material) : line
      )
    );
    setEditingMaterialId(null);
  };

  const setLineQuantity = (index: number, value: string) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, quantity: value === "" ? null : Number(value) } : line
      )
    );
  };


  /**
   * La cantidad de UNA prenda en una linea.
   *
   * Vacio quita la excepcion: la prenda vuelve a la cantidad general. Es la
   * unica forma de deshacerla, y por eso el campo se puede dejar en blanco en
   * vez de obligar a teclear el numero general otra vez.
   *
   * Cero NO es vacio: cero significa que esa prenda no lleva el material.
   */
  const setLineVariationQuantity = (
    index: number,
    variationId: number,
    value: string,
  ) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;

        const resto = line.variations.filter(
          (excepcion) => excepcion.variationId !== variationId,
        );

        if (value.trim() === "") return { ...line, variations: resto };

        return {
          ...line,
          variations: [...resto, { variationId, quantity: Number(value) }],
        };
      }),
    );
  };

  /**
   * Total en vivo mientras se edita. El valor que manda es el que calcula
   * el backend al guardar; esto es solo una previsualización para que el
   * usuario vea el efecto de lo que teclea.
   */
  const previewTotal = lines.reduce(
    (sum, line) => sum + (line.quantity ?? 0) * (line.unitCost ?? 0),
    0
  );

  const handleSubmit = async () => {
    const incomplete = lines.some((line) => !line.materialId);
    if (incomplete) {
      toast({ title: "Hay líneas sin material seleccionado", variant: "destructive" });
      return;
    }

    // Sin `description`: la escribe el backend a partir de las prendas
    // (fn_explosion_description). Mandarla desde aqui seria un valor que el SP
    // descarta, y que al leerlo de vuelta no coincidiria con lo enviado.
    const payload = {
      // Siempre, tambien vacio: vacio lo borra y ausente no lo tocaria.
      model_code: modelCode.trim(),
      materials: lines.map((line) => ({
        material_id: line.materialId,
        quantity: line.quantity,
        // Solo lo que DIFIERE de la cantidad general, y solo de prendas que
        // siguen en la receta: quitar una prenda tiene que llevarse sus
        // excepciones, no dejarlas apuntando a algo que ya no cubre.
        variations: line.variations
          .filter(
            (excepcion) =>
              variations.some((v) => v.id === excepcion.variationId) &&
              excepcion.quantity !== (line.quantity ?? 0),
          )
          .map((excepcion) => ({
            variation_id: excepcion.variationId,
            quantity: excepcion.quantity,
          })),
      })),
      // Siempre presente, incluso vacio: un array vacio quita todas las
      // prendas, y la clave ausente las dejaria como estan.
      variation_ids: variations.map((v) => v.id),
    };

    try {
      setSubmitting(true);

      if (isNew) {
        await createExplosionApi(payload);
        toast({ title: "Receta de producto creada exitosamente", variant: "success" });
      } else {
        await updateExplosionApi({ ...payload, id: explosionId! });
        toast({ title: "Receta de producto actualizada exitosamente", variant: "success" });
      }

      navigate("/suppliers/explosions");
    } catch (error: any) {
      toast({
        title: (isNew ? "Error al crear explosión: " : "Error al actualizar explosión: ") +
          error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    createdAt,
    /** Vuelve a lo guardado: es lo que descarta la edición al cancelar. */
    reload: loadExplosion,
    isNew,
    loading,
    submitting,
    materials,
    description,
    modelCode,
    setModelCode,
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
    variations,
    addVariation,
    addVariations,
    pickVariation,
    pickingVariation,
    removeVariation,
    materialSearch,
    setMaterialSearch,
    previewTotal,
    savedTotal,
    handleSubmit,
  };
};
