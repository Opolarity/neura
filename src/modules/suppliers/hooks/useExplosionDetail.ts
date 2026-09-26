import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  productByIdApi,
  variationsOfProductApi,
  VariationOption,
} from "../services/productionOrders.service";
import {
  ExplosionMaterial,
  ExplosionProcess,
  ExplosionProduct,
  ExplosionUnify,
} from "../types/explosions.types";
import { ProcessGroupOption } from "../components/explosions/ExplosionProcessesEditor";
import {
  createProcessApi,
  processGroupsListApi,
  processesListApi,
} from "../services/processes.service";
import { SaveProcessCatalogData } from "../types/processes.types";
import { MaterialOption } from "../types/services.types";
import {
  createExplosionApi,
  explosionByIdApi,
  explosionsListApi,
  updateExplosionApi,
} from "../services/explosions.service";
import { unifyExplosionApi } from "../services/productRecipes.service";
import { materialVariationLinkOptionsApi } from "../services/supplierServices.service";

interface UseExplosionDetailOptions {
  /** `undefined` o "new" abren el formulario en modo creación. */
  idParam?: string;
  /**
   * `?product=` de la URL: el producto cuya receta se crea. Llega desde
   * "Recetas" (Crear receta / Nuevo producto).
   */
  productParam?: string | null;
}

/**
 * Identidad de una opción del selector de material: la variación, o el
 * material (en negativo, para no chocar con ids de variación) si aún no se
 * resolvió cuál.
 */
export const optionKey = (option: { id: number; materialVariationId?: number | null }) =>
  option.materialVariationId ?? -option.id;

/** Línea vacía que se añade al pulsar "Añadir material". */
const emptyLine = (): ExplosionMaterial => ({
  materialId: 0,
  materialVariationId: null,
  materialName: "",
  materialClassId: null,
  materialClassName: null,
  measurementUnit: null,
  unitCost: null,
  quantity: null,
  lineTotal: 0,
  variations: [],
});

export const useExplosionDetail = ({ idParam, productParam }: UseExplosionDetailOptions) => {
  const navigate = useNavigate();
  const isNew = !idParam || idParam === "new";
  const explosionId = isNew ? null : Number(idParam);
  const productFromUrl =
    isNew && productParam && Number(productParam) > 0 ? Number(productParam) : null;

  const [loading, setLoading] = useState(!isNew || productFromUrl !== null);
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
  /**
   * La ruta del molde, EN ORDEN. La posición manda: al guardar, el backend
   * numera los pasos por la posición en el array.
   */
  const [processes, setProcesses] = useState<ExplosionProcess[]>([]);
  /** El catálogo de etapas (`process_group`) para el selector. */
  const [processGroups, setProcessGroups] = useState<ProcessGroupOption[]>([]);
  /**
   * El catálogo de operaciones, con la etapa a la que pertenece cada una: el
   * editor reparte por etapa en cliente en vez de pedirlas una por una.
   */
  const [operationCatalog, setOperationCatalog] = useState<
    Array<{
      processId: number;
      processName: string;
      processGroupId: number | null;
    }>
  >([]);
  const [savedTotal, setSavedTotal] = useState(0);

  /**
   * El producto de la receta. Una receta por producto: cubre TODAS sus
   * variaciones, y lo que cambia por prenda va como excepción en los
   * materiales. null = receta antigua o genérica, todavía sin producto.
   */
  const [product, setProduct] = useState<ExplosionProduct | null>(null);
  /** Receta antigua "por unificar": a qué producto podría pertenecer. */
  const [unify, setUnify] = useState<ExplosionUnify | null>(null);
  const [unifying, setUnifying] = useState(false);

  // Las prendas que cubre la receta: con producto, todas las suyas (solo se
  // leen). Son las columnas de las excepciones por prenda.
  const [variations, setVariations] = useState<VariationOption[]>([]);
  /** Se están cargando las variaciones del producto elegido. */
  const [pickingProduct, setPickingProduct] = useState(false);

  const [materialSearch, setMaterialSearch] = useState("");
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);

  // Catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setMaterials(await materialVariationLinkOptionsApi());
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      }
    };
    loadCatalogs();
  }, []);

  // Búsqueda de materiales en servidor: pueden ser miles.
  useEffect(() => {
    if (debouncedMaterialSearch === "") return;

    materialVariationLinkOptionsApi(debouncedMaterialSearch)
      .then(setMaterials)
      .catch(() => toast({ title: "Error al buscar materiales", variant: "destructive" }));
  }, [debouncedMaterialSearch]);

  // Las etapas activas del catálogo. Se piden una vez: son pocas y no cambian
  // mientras se escribe una receta. Un fallo aquí deja el selector vacío sin
  // impedir guardar los materiales.
  useEffect(() => {
    processGroupsListApi({ is_active: true, size: 100 })
      .then((response) =>
        setProcessGroups(
          response.data.map((grupo) => ({
            processGroupId: grupo.id,
            processGroupName: grupo.name,
          }))
        )
      )
      .catch(() =>
        toast({ title: "Error al cargar los procesos", variant: "destructive" })
      );
  }, []);

  // Las operaciones activas, con su etapa. Misma idea que las etapas: una
  // consulta al abrir, y el reparto por etapa se hace en memoria.
  useEffect(() => {
    processesListApi({ is_active: true, size: 200 })
      .then((response) =>
        setOperationCatalog(
          response.data.map((operacion) => ({
            processId: operacion.id,
            processName: operacion.name,
            processGroupId: operacion.processGroupId,
          }))
        )
      )
      .catch(() =>
        toast({ title: "Error al cargar las operaciones", variant: "destructive" })
      );
  }, []);

  const addProcess = (processGroupId: number) =>
    setProcesses((prev) =>
      // Una etapa no se repite en la misma receta: el índice único de
      // explosion_processes lo impide, así que aquí no se ofrece siquiera.
      prev.some((paso) => paso.processGroupId === processGroupId)
        ? prev
        : [
            ...prev,
            {
              processGroupId,
              processGroupName:
                processGroups.find((g) => g.processGroupId === processGroupId)
                  ?.processGroupName ?? null,
              // Nace completo: detallarlo en operaciones es opcional.
              operations: [],
            },
          ]
    );

  /** Añade una operación a la etapa de esa posición. */
  const addOperation = (indiceEtapa: number, processId: number) =>
    setProcesses((prev) =>
      prev.map((paso, i) => {
        if (i !== indiceEtapa) return paso;
        if (paso.operations.some((o) => o.processId === processId)) return paso;

        const operacion = operationCatalog.find((o) => o.processId === processId);
        return {
          ...paso,
          operations: [
            ...paso.operations,
            {
              processId,
              processName: operacion?.processName ?? null,
            },
          ],
        };
      })
    );

  const [creatingOperation, setCreatingOperation] = useState(false);

  /**
   * Da de alta una operación DESDE la receta y la deja puesta en ese paso.
   *
   * El catálogo de operaciones nace vacío, así que sin esto la receta era un
   * callejón sin salida: había que salir a Catálogos > Operaciones, crearlas y
   * volver. Mismo criterio que el "Crear grupo" de la ruta de una orden.
   */
  const createOperation = async (
    indiceEtapa: number,
    values: SaveProcessCatalogData
  ): Promise<boolean> => {
    const paso = processes[indiceEtapa];
    if (!paso) return false;

    try {
      setCreatingOperation(true);
      const createdId = await createProcessApi({
        ...values,
        // La operación nace colgada del proceso de esta fila: por eso el modal
        // no pregunta a cuál va.
        process_group_id: paso.processGroupId,
      });

      if (createdId === null) {
        toast({
          title: "La operación se creó pero no se pudo añadir al paso",
          variant: "destructive",
        });
        return false;
      }

      // Al catálogo, para que se ofrezca en los demás pasos de ese proceso...
      setOperationCatalog((prev) => [
        ...prev,
        {
          processId: createdId,
          processName: values.name,
          processGroupId: paso.processGroupId,
        },
      ]);

      // ...y al paso, que es a lo que se venía.
      setProcesses((prev) =>
        prev.map((item, i) =>
          i === indiceEtapa
            ? {
                ...item,
                operations: [
                  ...item.operations,
                  {
                    processId: createdId,
                    processName: values.name,
                  },
                ],
              }
            : item
        )
      );

      toast({ title: "Operación creada exitosamente", variant: "success" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error al crear la operación: " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setCreatingOperation(false);
    }
  };

  /**
   * Cambia una operación por otra del mismo proceso, conservando su sitio.
   *
   * La línea es un selector, no una etiqueta: elegir mal y tener que quitar y
   * volver a añadir era un paso de más.
   */
  const replaceOperation = (
    indiceEtapa: number,
    processIdViejo: number,
    processIdNuevo: number
  ) =>
    setProcesses((prev) =>
      prev.map((paso, i) => {
        if (i !== indiceEtapa) return paso;
        // Si ya está puesta, no se duplica: se deja como estaba.
        if (paso.operations.some((o) => o.processId === processIdNuevo)) return paso;

        const operacion = operationCatalog.find((o) => o.processId === processIdNuevo);
        return {
          ...paso,
          operations: paso.operations.map((o) =>
            o.processId === processIdViejo
              ? {
                  processId: processIdNuevo,
                  processName: operacion?.processName ?? null,
                }
              : o
          ),
        };
      })
    );

  /**
   * Pasa un proceso a "completo": se queda sin operaciones.
   *
   * El modelo siempre fue excluyente --un proceso está suelto o detallado--,
   * solo que antes se deducía de una lista vacía. Ahora es un botón.
   */
  const clearOperations = (indiceEtapa: number) =>
    setProcesses((prev) =>
      prev.map((paso, i) => (i === indiceEtapa ? { ...paso, operations: [] } : paso))
    );

  /** La quita. Sin ninguna, la etapa vuelve a ir completa. */
  const removeOperation = (indiceEtapa: number, processId: number) =>
    setProcesses((prev) =>
      prev.map((paso, i) =>
        i === indiceEtapa
          ? { ...paso, operations: paso.operations.filter((o) => o.processId !== processId) }
          : paso
      )
    );

  const removeProcess = (index: number) =>
    setProcesses((prev) => prev.filter((_, i) => i !== index));

  /** Mueve un paso una posición: `delta` es -1 (sube) o +1 (baja). */
  const moveProcess = (index: number, delta: number) =>
    setProcesses((prev) => {
      const destino = index + delta;
      if (destino < 0 || destino >= prev.length) return prev;

      const siguiente = [...prev];
      [siguiente[index], siguiente[destino]] = [siguiente[destino], siguiente[index]];
      return siguiente;
    });

  const loadExplosion = useCallback(async () => {
    if (explosionId === null) return;

    try {
      setLoading(true);
      const detail = await explosionByIdApi(explosionId);
      setDescription(detail.description);
      setModelCode(detail.modelCode ?? "");
      setLines(detail.materials);
      setProcesses(detail.processes);
      setSavedTotal(detail.total);
      setCreatedAt(detail.createdAt);
      setProduct(detail.product);
      setUnify(detail.unify);
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

  /**
   * Fija el producto de la receta y trae TODAS sus variaciones.
   *
   * Antes de dejar escribir se mira si el producto ya tiene receta (o recetas
   * antiguas por unificar): una receta por producto, así que en ese caso se
   * abre la que hay en vez de dejar escribir otra que el backend rechazaría
   * al guardar.
   */
  const pickProduct = useCallback(
    async (productId: number) => {
      setPickingProduct(true);
      try {
        const existentes = await explosionsListApi({ product_id: productId, size: 20 });
        const suya = existentes.data.find((e) => e.productId === productId);
        const antigua = existentes.data.find((e) => e.productId === null);
        if (suya || antigua) {
          const destino = (suya ?? antigua)!;
          toast({
            title: suya
              ? `Este producto ya tiene su receta (#${destino.id})`
              : `Este producto tiene recetas por unificar: se abre la #${destino.id}`,
          });
          navigate(`/suppliers/explosions/${destino.id}`, { replace: true });
          return;
        }

        const [producto, tallas] = await Promise.all([
          productByIdApi(productId),
          variationsOfProductApi(productId),
        ]);
        if (!producto) {
          toast({ title: "No se encontró el producto", variant: "destructive" });
          return;
        }
        setProduct({ id: producto.id, title: producto.title, code: null });
        setVariations(tallas);
      } catch (error: any) {
        toast({
          title: "Error al cargar el producto: " + error.message,
          variant: "destructive",
        });
      } finally {
        setPickingProduct(false);
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (productFromUrl !== null) pickProduct(productFromUrl);
  }, [productFromUrl, pickProduct]);

  /**
   * Receta antigua: queda como LA receta de su producto. Las demás recetas
   * antiguas de ese producto sueltan sus tallas (no se borran: las órdenes que
   * ya las usan siguen igual).
   */
  const handleUnify = async () => {
    if (explosionId === null || !unify) return;
    try {
      setUnifying(true);
      await unifyExplosionApi(explosionId, unify.productId);
      toast({ title: "Receta asignada al producto", variant: "success" });
      await loadExplosion();
    } catch (error: any) {
      toast({ title: "No se pudo unificar: " + error.message, variant: "destructive" });
    } finally {
      setUnifying(false);
    }
  };

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
  const materialCreated = async (material: MaterialOption) => {
    // El alta devuelve el material; la línea necesita su VARIACIÓN, que nace
    // con él. Se lee de vuelta como opción; si fallara, la línea se queda con
    // el material y el backend usa su única variación.
    const target = creatingMaterialFor;
    setCreatingMaterialFor(null);
    let option = material;
    try {
      const [variacion] = await materialVariationLinkOptionsApi(null, { materialId: material.id });
      if (variacion) option = variacion;
    } catch {
      // Sin la variación la línea sigue valiendo: ver arriba.
    }
    setMaterials((prev) =>
      prev.some((m) => optionKey(m) === optionKey(option)) ? prev : [...prev, option]
    );
    if (target !== null) {
      setLineMaterial(target, option);
    }
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
    materialVariationId: material.materialVariationId ?? null,
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
  const materialUpdated = async (material: MaterialOption) => {
    setEditingMaterialId(null);
    // Lo editado es el MATERIAL; cada línea consume una de sus variaciones, y
    // su etiqueta, costo y unidad salen de ahí. Se releen esas variaciones en
    // vez de pisar la línea con el material, que le quitaría cuál es.
    let variaciones: MaterialOption[] = [];
    try {
      variaciones = await materialVariationLinkOptionsApi(null, { materialId: material.id });
    } catch {
      variaciones = [];
    }
    const porVariacion = new Map(
      variaciones.map((v) => [v.materialVariationId ?? 0, v] as const)
    );
    setMaterials((prev) =>
      prev.map((m) =>
        m.materialVariationId && porVariacion.has(m.materialVariationId)
          ? (porVariacion.get(m.materialVariationId) as MaterialOption)
          : m.id === material.id && !m.materialVariationId
            ? material
            : m
      )
    );
    setLines((prev) =>
      prev.map((line) => {
        if (line.materialId !== material.id) return line;
        const variacion = line.materialVariationId
          ? porVariacion.get(line.materialVariationId)
          : undefined;
        return applyMaterial(line, variacion ?? { ...material, materialVariationId: line.materialVariationId });
      })
    );
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
    // Toda receta nueva nace con su producto: es lo que la hace aparecer en
    // "Recetas" y lo que la ofrece sola en la orden.
    if (isNew && !product) {
      toast({ title: "Elige el producto de la receta", variant: "destructive" });
      return;
    }

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
        material_variation_id: line.materialVariationId,
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
      // El producto, no las prendas: la receta cubre todas las suyas y el
      // backend las pone. Sin producto (receta antigua por unificar) no se
      // manda nada y sus prendas se quedan como están.
      ...(product ? { product_id: product.id } : {}),
      // Misma regla para la ruta. El ORDEN del array es la secuencia: el
      // backend numera los pasos por la posicion, no por un campo.
      processes: processes.map((paso) => ({
        process_group_id: paso.processGroupId,
        // Vacío = proceso completo. El backend lo guarda como una sola fila
        // sin operación, que es como se guardaba todo antes.
        operations: paso.operations.map((o) => ({
          process_id: o.processId,
        })),
      })),
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
    product,
    pickProduct,
    pickingProduct,
    unify,
    unifying,
    handleUnify,
    materialSearch,
    setMaterialSearch,
    previewTotal,
    savedTotal,
    handleSubmit,
  };
};
