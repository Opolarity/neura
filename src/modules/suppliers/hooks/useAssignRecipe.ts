import { useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ComboboxOption } from "../components/EntityCombobox";
import {
  assignExplosionToProductsApi,
  explosionByIdApi,
  explosionsListApi,
} from "../services/explosions.service";
import { productRecipesListApi } from "../services/productRecipes.service";
import { AssignRecipeResult } from "../types/explosions.types";
import { ProductRecipe } from "../types/productRecipes.types";

/** Lo que se muestra de la receta elegida antes de asignarla. */
export interface AssignRecipeSource {
  id: number;
  modelCode: string;
  productTitle: string | null;
  materialsCount: number;
  /** Etapas de la ruta y operaciones dentro de ellas. */
  processesCount: number;
  operationsCount: number;
}

/** Un producto marcado: se guarda el nombre para pintarlo aunque salga de la búsqueda. */
export interface AssignRecipeTarget {
  id: number;
  title: string;
}

const PRODUCTS_PAGE_SIZE = 50;

/**
 * Asignación masiva de receta (2026-10-28): se elige un código de modelo y los
 * productos sin receta que lo reciben. El backend copia materiales y
 * operaciones a cada uno, con el mismo código.
 */
export const useAssignRecipe = (onAssigned: (result: AssignRecipeResult) => void) => {
  const [sourceSearch, setSourceSearch] = useState("");
  const debouncedSource = useDebounce(sourceSearch, 300);
  const [sourceOptions, setSourceOptions] = useState<ComboboxOption[]>([]);
  const [source, setSource] = useState<AssignRecipeSource | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const debouncedProduct = useDebounce(productSearch, 300);
  const [products, setProducts] = useState<ProductRecipe[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selected, setSelected] = useState<Map<number, AssignRecipeTarget>>(new Map());

  const [submitting, setSubmitting] = useState(false);

  // Solo recetas con código: es el código lo que se asigna.
  useEffect(() => {
    let vigente = true;
    explosionsListApi({ search: debouncedSource || undefined, page: 1, size: 20 })
      .then((res) => {
        if (!vigente) return;
        setSourceOptions(
          res.data
            .filter((r) => r.modelCode)
            .map((r) => {
              const nombre = r.productTitle ?? r.description ?? `Receta #${r.id}`;
              const label = `${r.modelCode} · ${nombre}`;
              return { id: r.id, label, title: label };
            }),
        );
      })
      .catch(() => vigente && setSourceOptions([]));
    return () => {
      vigente = false;
    };
  }, [debouncedSource]);

  // Los candidatos: productos propios SIN receta. Los que ya tienen una se
  // cambian desde su ficha; los pendientes de unificar, igual.
  useEffect(() => {
    let vigente = true;
    setLoadingProducts(true);
    productRecipesListApi({
      search: debouncedProduct || undefined,
      recipe_state: "WITHOUT",
      page: 1,
      size: PRODUCTS_PAGE_SIZE,
    })
      .then((res) => {
        if (!vigente) return;
        setProducts(res.data);
        setProductsTotal(res.pagination.total);
      })
      .catch(() => {
        if (!vigente) return;
        setProducts([]);
        setProductsTotal(0);
        toast({ title: "Error al cargar los productos", variant: "destructive" });
      })
      .finally(() => vigente && setLoadingProducts(false));
    return () => {
      vigente = false;
    };
  }, [debouncedProduct]);

  const chooseSource = async (option: ComboboxOption) => {
    try {
      setLoadingSource(true);
      const detalle = await explosionByIdApi(option.id);
      setSource({
        id: detalle.id,
        modelCode: detalle.modelCode ?? "",
        productTitle: detalle.product?.title ?? null,
        materialsCount: detalle.materials.length,
        processesCount: detalle.processes.length,
        operationsCount: detalle.processes.reduce(
          (total, etapa) => total + etapa.operations.length,
          0,
        ),
      });
    } catch (error) {
      setSource(null);
      toast({ title: "No se pudo leer la receta: " + (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingSource(false);
    }
  };

  const toggleProduct = (product: ProductRecipe, checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(product.productId, { id: product.productId, title: product.productTitle });
      else next.delete(product.productId);
      return next;
    });

  const removeProduct = (productId: number) =>
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });

  /** Marca o desmarca todos los que se ven con la búsqueda actual. */
  const toggleVisible = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      products.forEach((p) => {
        if (checked) next.set(p.productId, { id: p.productId, title: p.productTitle });
        else next.delete(p.productId);
      });
      return next;
    });

  const visibleSelected = products.filter((p) => selected.has(p.productId)).length;

  const submit = async () => {
    if (!source) {
      toast({ title: "Elige el código de modelo", variant: "destructive" });
      return;
    }
    if (selected.size === 0) {
      toast({ title: "Elige al menos un producto", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const result = await assignExplosionToProductsApi(source.id, [...selected.keys()]);
      const omitidos = result.skipped.filter((s) => s.reason === "ALREADY_ASSIGNED").length;
      toast({
        title:
          result.created.length === 0
            ? `Esos productos ya tenían el modelo ${result.modelCode}`
            : `Modelo ${result.modelCode} asignado a ${result.created.length} producto${result.created.length === 1 ? "" : "s"}`,
        description: omitidos > 0 ? `${omitidos} ya lo tenían y se dejaron igual.` : undefined,
        variant: result.created.length === 0 ? "info" : "success",
      });
      onAssigned(result);
    } catch (error) {
      toast({ title: "No se pudo asignar la receta: " + (error as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    sourceSearch,
    setSourceSearch,
    sourceOptions,
    source,
    loadingSource,
    chooseSource,
    productSearch,
    setProductSearch,
    products,
    productsTotal,
    loadingProducts,
    selected: [...selected.values()],
    isSelected: (productId: number) => selected.has(productId),
    visibleSelected,
    toggleProduct,
    toggleVisible,
    removeProduct,
    submitting,
    submit,
  };
};
