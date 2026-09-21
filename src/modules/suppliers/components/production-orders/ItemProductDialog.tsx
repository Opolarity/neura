import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/shared/components/MultiSelect";
import { createCategoryApi } from "@/modules/products/services/Categories.service";
import CategoryQuickAddForm from "@/modules/products/components/products/CategoryQuickAddForm";
import TagQuickAddForm from "@/modules/products/components/products/TagQuickAddForm";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/modules/products/utils/categoryTree";
import { createTag } from "@/modules/products/services/Tags.service";
import { slugify } from "@/shared/utils/slug";
import { cn } from "@/shared/utils/utils";
import { AddProductService } from "@/modules/products/services/AddProduct.service";
import type { Category, Term, TermGroup } from "@/types";
import type { ProductTag } from "@/modules/products/types/AddProduct.types";
import {
  ProductVariationSelector,
  type ProductVariationOption,
} from "@/shared/components/product-variation-selector";
import {
  ProductImage,
  ProductOption,
  ProductVariationSummary,
  VariationOption,
  addProductImageApi,
  addProductTaxonomyApi,
  addProductVariationApi,
  variationsOfProductApi,
  deleteProductImageApi,
  productByIdApi,
  productVariationsApi,
  reorderProductImagesApi,
  productImagesApi,
  variationByIdApi,
} from "../../services/productionOrders.service";

/**
 * De dónde sale el producto del ítem.
 *
 * `existing` cuando la variación ya existe, `new` cuando hay que crear el
 * producto entero, y `variation` cuando el producto ya está — porque otra
 * talla de la misma prenda lo creó — y solo falta sumarle esta talla.
 */
type Mode = "existing" | "new" | "variation";

/**
 * Un atributo de la variación mientras se edita: Talla → S, M, L, XL.
 *
 * Cada fila lleva un grupo y UNO O VARIOS términos. Con un término por fila
 * sale una variación; con varios, una por combinación (Talla S/M × Color
 * rojo/azul = 4). Así una prenda en cuatro tallas se da de alta en una sola
 * pasada, en vez de abrir el diálogo cuatro veces.
 *
 * Los ids van como texto porque es lo que manejan los selectores. Al mandarlos
 * se convierten a la forma que espera el backend, que es la misma
 * `VariationAttribute` de la pantalla de productos: `{term_group_id, term_id}`.
 */
interface AttributeRow {
  termGroupId: string;
  termIds: string[];
}

/** Un atributo ya resuelto, tal como lo esperan los SPs. */
interface VariationAttribute {
  term_group_id: number;
  term_id: number;
}

const emptyAttribute = (): AttributeRow => ({ termGroupId: "", termIds: [] });

/**
 * Producto cartesiano de las filas: una combinación por variación a crear.
 *
 * Con Talla [S, M] y Color [rojo] devuelve [[S, rojo], [M, rojo]]. Cada
 * combinación conserva el orden de las filas, que es el orden en que se
 * muestran los términos en la etiqueta.
 */
const combineAttributes = (rows: AttributeRow[]): VariationAttribute[][] => {
  const filled = rows.filter((r) => r.termGroupId && r.termIds.length > 0);
  if (filled.length === 0) return [];
  return filled.reduce<VariationAttribute[][]>(
    (acc, row) =>
      acc.flatMap((combo) =>
        row.termIds.map((termId) => [
          ...combo,
          { term_group_id: Number(row.termGroupId), term_id: Number(termId) },
        ])
      ),
    [[]]
  );
};

interface ItemProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * La prenda que el ítem ya tiene vinculada, si tiene alguna.
   *
   * El diálogo abre SOBRE ella en vez de en blanco: pulsar un producto ya
   * vinculado es casi siempre «me faltó clasificarlo» o «le falta la foto»,
   * no «quiero otro». Cambiarlo sigue estando a un clic, en el buscador.
   */
  linkedVariationId?: number | null;
  /**
   * Lo elegido o creado. Siempre al menos una; varias cuando el usuario
   * marcó varios términos (S, M, L, XL) y se crearon todas de golpe.
   */
  onSelected: (variations: VariationOption[]) => void;
}

/**
 * Elegir o crear el producto final de un ítem de la orden.
 *
 * Sin esto `production_order_items.variation_id` se queda en NULL y el costo
 * unitario no puede salir: el backend cuenta las prendas buenas por los
 * movimientos de stock de esa variación.
 *
 * El tercer modo es el que evita el error clásico: una orden trae la misma
 * prenda en cuatro tallas, y eso es UN producto con cuatro variaciones, no
 * cuatro productos llamados casi igual.
 */
export const ItemProductDialog = ({
  open,
  onOpenChange,
  linkedVariationId = null,
  onSelected,
}: ItemProductDialogProps) => {
  const [mode, setMode] = useState<Mode>("existing");
  const [saving, setSaving] = useState(false);

  // Modo "existing". La lista la pone el selector compartido; aqui solo vive
  // lo elegido, ya hidratado con la clasificacion de su producto.
  const [selectedVariation, setSelectedVariation] =
    useState<VariationOption | null>(null);
  const [loadingVariation, setLoadingVariation] = useState(false);

  // Modo "variation"
  /** El input de fichero, que vive escondido detrás del botón. */
  const imageInputRef = useRef<HTMLInputElement>(null);
  /**
   * Qué miniatura se está arrastrando. Distingue reordenar de soltar ficheros:
   * con una miniatura en la mano, la zona punteada no debe encenderse.
   */
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  /** Las tallas que el producto elegido YA tiene, para no pedir una repetida. */
  const [existingVariations, setExistingVariations] = useState<
    ProductVariationSummary[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null
  );
  const [loadingProduct, setLoadingProduct] = useState(false);

  /**
   * Las imágenes del PRODUCTO elegido, y la que se escogió para subir en el
   * modo «crear» -- ahí todavía no hay producto al que colgarla.
   */
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  // Modo "new"
  const [productName, setProductName] = useState("");
  /**
   * Catálogos de clasificación. Ya venían en getFormData() junto a los
   * atributos; hasta ahora se descartaban y el producto se creaba con
   * `selectedCategories: []` en duro, así que nacía sin clasificar.
   */
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [tagOptions, setTagOptions] = useState<ProductTag[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  /**
   * Lo que el producto YA tenía al elegirlo. Se guarda aparte para mandar solo
   * lo añadido: `sp_add_product_taxonomy` suma, no reemplaza, y reenviar lo
   * que ya estaba sería trabajo para nada.
   */
  const [baseCategoryIds, setBaseCategoryIds] = useState<string[]>([]);
  const [baseTagIds, setBaseTagIds] = useState<string[]>([]);
  const [hasVariation, setHasVariation] = useState(false);

  // Común a "new" y "variation": los atributos de la variación
  const [termGroups, setTermGroups] = useState<TermGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  /**
   * Una fila por atributo: talla M, color rojo. Es una lista y no un par
   * porque una variación se define por tantos atributos como haga falta, y
   * los dos SPs ya los aceptan — `attributes` en sp_create_product y
   * `p_term_ids` en sp_add_product_variation.
   */
  const [attributes, setAttributes] = useState<AttributeRow[]>([emptyAttribute()]);

  /**
   * Lo tecleado va aparte de lo buscado: la consulta solo sale al pulsar la
   * lupa o con Enter, como los buscadores de los listados. Con debounce se
   * disparaba una consulta por pausa al escribir.
   */

  // El diálogo se monta al abrirse, así que esto corre una vez por apertura.
  useEffect(() => {
    if (!open) return;

    setMode("existing");
    // Arranca en blanco: el ítem ya no tiene nombre con el que precargar la
    // búsqueda -- es justo al revés, el producto es lo que le da nombre.
    setProductImages([]);
    setPendingImages([]);
    setProductName("");
    setHasVariation(false);
    setSelectedVariation(null);
    setSelectedProduct(null);
    setExistingVariations([]);
    setAttributes([emptyAttribute()]);
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setBaseCategoryIds([]);
    setBaseTagIds([]);

    AddProductService.getFormData()
      .then((data) => {
        setTermGroups(data.termGroups ?? []);
        setTerms(data.terms ?? []);
        setCategoryOptions(data.categories ?? []);
        setTagOptions(data.tags ?? []);
      })
      .catch(() => toast({ title: "Error al cargar los atributos", variant: "destructive" }));

    // Si el ítem ya tiene prenda, el diálogo abre SOBRE ella: cargada, con su
    // clasificación y sus fotos. Va después del reset a propósito -- el reset
    // deja el formulario limpio y esto lo rellena con lo que hay.
    if (linkedVariationId) void loadVariation(linkedVariationId);
    // `loadVariation` es estable y solo se quiere reaccionar a la apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, linkedVariationId]);

  /** Grupos ya usados: una variación no puede llevar Talla dos veces. */
  const usedGroups = useMemo(
    () => new Set(attributes.map((a) => a.termGroupId).filter(Boolean)),
    [attributes]
  );

  /** Términos del grupo de esa fila, que es lo único seleccionable ahí. */
  const termsOfRow = useCallback(
    (groupId: string) =>
      groupId ? terms.filter((t) => String(t.term_group_id) === groupId) : [],
    [terms]
  );

  const addAttribute = useCallback(
    () => setAttributes((prev) => [...prev, emptyAttribute()]),
    []
  );

  const removeAttribute = useCallback(
    (index: number) =>
      setAttributes((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const setAttributeGroup = useCallback((index: number, value: string) => {
    setAttributes((prev) =>
      prev.map((row, i) =>
        // Cambiar de grupo invalida los términos elegidos del grupo anterior.
        i === index ? { termGroupId: value, termIds: [] } : row
      )
    );
  }, []);

  const setAttributeTerms = useCallback((index: number, value: string[]) => {
    setAttributes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, termIds: value } : row))
    );
  }, []);

  /**
   * Las variaciones a crear: una lista de atributos por cada combinación de
   * lo marcado. Con un término por fila es una sola, como antes.
   */
  const combinations = useMemo(
    () => combineAttributes(attributes),
    [attributes]
  );

  /** Etiqueta legible de una combinación: «S / Rojo». Para la vista previa. */
  const comboLabel = useCallback(
    (combo: VariationAttribute[]) =>
      combo
        .map((a) => terms.find((t) => Number(t.id) === a.term_id)?.name ?? "")
        .filter(Boolean)
        .join(" / "),
    [terms]
  );

  /**
   * Carga en los selectores lo que la prenda elegida YA tiene.
   *
   * Es lo que faltaba: se elegía un producto y los selectores seguían vacíos,
   * así que no se veía su clasificación ni había dónde sumarle una.
   */
  const preloadTaxonomy = useCallback((categoryIds: number[], tagIds: number[]) => {
    const cats = categoryIds.map(String);
    const tgs = tagIds.map(String);
    setSelectedCategoryIds(cats);
    setSelectedTagIds(tgs);
    setBaseCategoryIds(cats);
    setBaseTagIds(tgs);
  }, []);

  /**
   * Lo elegido en el selector compartido, hidratado.
   *
   * El selector busca en el catalogo de venta y devuelve producto, talla y
   * sku; las categorias y etiquetas cuelgan del producto y no vienen ahi, asi
   * que se piden aparte -- una consulta al elegir, no en cada tecla-- para que
   * el bloque de clasificacion siga saliendo cargado con lo que la prenda ya
   * tiene.
   */
  const loadVariation = useCallback(
    async (variationId: number) => {
      setLoadingVariation(true);
      try {
        const full = await variationByIdApi(variationId);
        if (!full) {
          toast({
            title: "No se encontró esa prenda",
            variant: "destructive",
          });
          return;
        }
        setSelectedVariation(full);
        preloadTaxonomy(full.categoryIds, full.tagIds);
        // Las imágenes son del PRODUCTO. Sin productId no hay a qué mirar.
        setProductImages(
          full.productId ? await productImagesApi(full.productId) : []
        );
      } catch {
        toast({
          title: "No se pudo cargar la prenda",
          variant: "destructive",
        });
      } finally {
        setLoadingVariation(false);
      }
    },
    [preloadTaxonomy]
  );

  const handleVariationPicked = useCallback(
    (picked: ProductVariationOption) => loadVariation(picked.id),
    [loadVariation]
  );

  /**
   * Lo elegido en el selector compartido, en modo producto.
   *
   * Mismo trato que la variación: el selector devuelve id y título, y si es
   * variable, su clasificación y sus imágenes se piden aparte al elegir.
   */
  const handleProductPicked = useCallback(
    async (picked: ProductVariationOption) => {
      setLoadingProduct(true);
      try {
        const full = await productByIdApi(picked.id);
        if (!full) {
          toast({ title: "No se encontró ese producto", variant: "destructive" });
          return;
        }
        setSelectedProduct(full);
        preloadTaxonomy(full.categoryIds, full.tagIds);
        // En paralelo: son dos lecturas sueltas del mismo producto y
        // encadenarlas solo suma espera.
        const [imagenes, tallas] = await Promise.all([
          productImagesApi(full.id),
          productVariationsApi(full.id),
        ]);
        setProductImages(imagenes);
        setExistingVariations(tallas);
      } catch {
        toast({
          title: "No se pudo cargar el producto elegido",
          variant: "destructive",
        });
      } finally {
        setLoadingProduct(false);
      }
    },
    [preloadTaxonomy]
  );

  /**
   * Subirle fotos al producto elegido.
   *
   * Varias de una vez: una prenda se referencia con la de frente y la de
   * espalda, y obligar a elegirlas de una en una era pedir el mismo clic dos
   * veces para lo mismo.
   *
   * Se suben EN ORDEN y no en paralelo: el orden de la lista es el que sale en
   * la Orden de Producción, y `addProductImageApi` calcula el suyo a partir de
   * las que ya hay — en paralelo dos fotos pedirían el mismo número.
   *
   * En «crear» todavía no hay producto al que colgarlas, así que los ficheros
   * se guardan y se suben DESPUÉS del alta.
   */
  const handlePickImages = async (files: File[], productId: number | null) => {
    if (files.length === 0) return;

    if (!productId) {
      setPendingImages((prev) => [...prev, ...files]);
      return;
    }

    setUploadingImage(true);
    try {
      for (const file of files) {
        const image = await addProductImageApi(productId, file);
        setProductImages((prev) => [...prev, image]);
      }
      toast({
        title:
          files.length === 1
            ? "Imagen subida"
            : `${files.length} imágenes subidas`,
      });
    } catch {
      // Si falla la tercera, las dos primeras YA están subidas y en la lista.
      // Se dice, en vez de dejar creer que no entró ninguna.
      toast({
        title: "No se pudieron subir todas las imágenes",
        description: "Las que sí entraron ya aparecen arriba.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Crear una categoría desde aquí y dejarla marcada.
   *
   * Sin esto, encontrarse con que la categoría no existe obligaba a salir a
   * Productos y volver a empezar el ítem.
   *
   * Puede colgar de otra: el árbol también se arma desde aquí. Antes nacía
   * suelta a la fuerza --`parent_category: null` en duro-- y eso obligaba a
   * ir a Productos a recolocarla después.
   *
   * Devuelve si se creó, que es lo que `CategoryQuickAddForm` espera para
   * saber si limpia sus campos.
   */
  const handleCreateCategory = async ({
    name: rawName,
    parent_category,
  }: {
    name: string;
    parent_category: number | null;
  }): Promise<boolean> => {
    const name = rawName.trim();
    if (!name) return false;
    try {
      await createCategoryApi({
        name,
        parent_category,
        description: null,
        // Obligatorio en el CategoryPayload de personalizado: un alta rapida
        // desde produccion no sube imagen.
        image_url: null,
      });
      // El alta no devuelve la fila, así que se relee el catálogo y se busca
      // por nombre: es la única forma de quedarse con su id.
      const data = await AddProductService.getFormData();
      const options: Category[] = data.categories ?? [];
      setCategoryOptions(options);
      const created = options.find((c) => c.name === name);
      if (created) {
        setSelectedCategoryIds((prev) => [...prev, String(created.id)]);
      }
      toast({ title: `Categoría "${name}" creada`, variant: "success" });
      return true;
    } catch (error: any) {
      toast({
        title: "No se pudo crear la categoría: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Crear una etiqueta desde el propio campo y dejarla marcada.
   *
   * Devuelve la creada, que es el contrato de `TagQuickAddForm`: el formulario
   * lleva el texto tecleado y necesita la fila de vuelta para saber si limpiar
   * el campo. Dejarla MARCADA lo hace esto, no el formulario.
   */
  const handleCreateTag = async (rawName: string): Promise<ProductTag | null> => {
    const name = rawName.trim();
    if (!name) return null;
    try {
      await createTag({ name, code: slugify(name) });
      // El alta no devuelve la fila, así que se relee el catálogo y se busca
      // por nombre: es la única forma de quedarse con su id.
      const data = await AddProductService.getFormData();
      const options: ProductTag[] = data.tags ?? [];
      setTagOptions(options);
      const created = options.find((t) => t.name === name) ?? null;
      if (created) {
        setSelectedTagIds((prev) => [...prev, String(created.id)]);
      }
      toast({ title: `Etiqueta "${name}" creada`, variant: "success" });
      return created;
    } catch (error: any) {
      toast({
        title: "No se pudo crear la etiqueta: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Las categorías con su nivel, para pintar la sangría y el «└». Mismo par de
   * funciones que la ficha de producto, para que el árbol se lea igual en las
   * dos pantallas.
   */
  const categoriasJerarquicas = useMemo(
    () => flattenCategoryTree(buildCategoryTree(categoryOptions)),
    [categoryOptions],
  );

  /** Marcar y desmarcar, que es lo que piden las casillas y el campo de etiquetas. */
  const toggleCategory = (categoryId: number) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(String(categoryId))
        ? prev.filter((id) => id !== String(categoryId))
        : [...prev, String(categoryId)],
    );

  const toggleTag = (tagId: number) =>
    setSelectedTagIds((prev) =>
      prev.includes(String(tagId))
        ? prev.filter((id) => id !== String(tagId))
        : [...prev, String(tagId)],
    );

  /** Lo que se ha añadido respecto a lo que el producto ya tenía. */
  const addedCategoryIds = selectedCategoryIds
    .filter((id) => !baseCategoryIds.includes(id))
    .map(Number);
  const addedTagIds = selectedTagIds
    .filter((id) => !baseTagIds.includes(id))
    .map(Number);

  /**
   * Alta al vuelo del producto.
   *
   * Se manda `stock: []` a propósito: `sp_create_product` inserta en
   * `variation_stock` y además un `stock_movements`, y el trigger de ese
   * movimiento vuelve a sumar sobre la fila recién creada — el stock inicial
   * quedaría al doble. El stock entra por el ingreso del último servicio,
   * que es un solo movimiento.
   */
  const createProduct = async (): Promise<VariationOption[]> => {
    // Sin variación el producto es simple: su única variación no lleva
    // términos, y sp_create_product lo admite con el array vacío. Con
    // variación va una por combinación marcada, todas en la misma llamada.
    const variationsToCreate = hasVariation
      ? combinations.map((attributes, i) => ({
          id: `new-${i + 1}`,
          attributes,
          prices: [],
          stock: [],
          selectedImages: [],
        }))
      : [{ id: "new-1", attributes: [], prices: [], stock: [], selectedImages: [] }];

    const response = await AddProductService.createProduct({
      productName: productName.trim(),
      shortDescription: "",
      promotionalText: "",
      promotionalBgColor: "",
      promotionalTextColor: "",
      sizesImageUrl: null,
      sizesRefImageUrl: null,
      exhibitionStartDate: null,
      exhibitionEndDate: null,
      description: "",
      isVariable: hasVariation,
      isActive: true,
      isWeb: false,
      selectedCategories: selectedCategoryIds.map(Number),
      selectedChannels: [],
      selectedTags: selectedTagIds.map(Number),
      selectedBrands: [],
      productImages: [],
      variations: variationsToCreate,
    });

    const productId = response?.product?.id;
    if (!productId) {
      throw new Error("El producto se creó pero no devolvió su id");
    }

    // La foto elegida antes de que el producto existiera. Se sube ahora, que
    // es cuando hay a qué colgarla. Si falla, el producto YA está creado: se
    // avisa y se sigue -- perder el alta por una imagen sería peor.
    if (pendingImages.length > 0) {
      try {
        // En orden: es el que sale en el papel.
        for (const file of pendingImages) {
          await addProductImageApi(Number(productId), file);
        }
      } catch {
        toast({
          title: "El producto se creó, pero alguna imagen no se pudo subir",
          variant: "destructive",
        });
      }
    }

    // create-product solo devuelve el id del producto, no los de las
    // variaciones: se releen todas, en el orden en que se crearon.
    const variations = await variationsOfProductApi(Number(productId));
    if (variations.length === 0) {
      throw new Error("El producto se creó pero no se encontró su variación");
    }
    return variations;
  };

  /** Lo que falta en la lista de atributos, o null si está completa. */
  const attributesError = (): string | null => {
    if (combinations.length === 0) {
      return "Añade al menos un atributo con su término";
    }
    // Una fila a medias es un descuido, no una fila que sobra: mejor avisar
    // que descartarla en silencio.
    if (attributes.some((a) => a.termGroupId && a.termIds.length === 0)) {
      return "Hay un atributo sin término elegido";
    }
    return null;
  };

  const validate = (): string | null => {
    if (mode === "existing") {
      if (!selectedVariation) return "Elige el producto que sale de este ítem";
      return null;
    }
    if (mode === "new") {
      if (!productName.trim()) return "El nombre del producto es obligatorio";
      if (hasVariation) return attributesError();
      return null;
    }
    if (!selectedProduct) return "Elige el producto al que añadir la variación";
    return attributesError();
  };

  const handleConfirm = async () => {
    const error = validate();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      let variations: VariationOption[];
      if (mode === "existing") {
        let variation = selectedVariation!;
        // Lo añadido se guarda al momento: sp_add_product_taxonomy SUMA, no
        // reemplaza, así que desde aquí no se puede borrar por descuido lo que
        // se clasificó en Productos.
        if (
          variation.productId !== null &&
          (addedCategoryIds.length > 0 || addedTagIds.length > 0)
        ) {
          await addProductTaxonomyApi(
            variation.productId,
            addedCategoryIds,
            addedTagIds
          );
          variation = {
            ...variation,
            categoryIds: selectedCategoryIds.map(Number),
            tagIds: selectedTagIds.map(Number),
          };
        }
        variations = [variation];
      } else if (mode === "new") {
        variations = await createProduct();
        toast({
          title:
            variations.length > 1
              ? `Producto creado con ${variations.length} variaciones`
              : "Producto creado y asignado al ítem",
          variant: "success",
        });
      } else {
        // Primero la clasificación: si se le añade una categoría al producto,
        // la variación nueva ya nace con ella y no hace falta releerla.
        if (addedCategoryIds.length > 0 || addedTagIds.length > 0) {
          await addProductTaxonomyApi(
            selectedProduct!.id,
            addedCategoryIds,
            addedTagIds
          );
        }
        // La clasificación es del producto y ya está en pantalla: se pasa en
        // vez de pagar otra consulta por un dato que tenemos delante. Los
        // nombres se recomponen desde el catálogo para que incluyan lo que
        // se acaba de crear.
        const taxonomy = {
          categories: categoryOptions
            .filter((c) => selectedCategoryIds.includes(String(c.id)))
            .map((c) => c.name),
          tags: tagOptions
            .filter((t) => selectedTagIds.includes(String(t.id)))
            .map((t) => t.name),
          categoryIds: selectedCategoryIds.map(Number),
          tagIds: selectedTagIds.map(Number),
        };
        // Una llamada por combinación, en secuencia: la edge function crea de
        // una en una y reutiliza la que ya exista, así que repetir no duplica.
        variations = [];
        for (const combo of combinations) {
          variations.push(
            await addProductVariationApi(
              selectedProduct!.id,
              combo.map((a) => a.term_id),
              taxonomy
            )
          );
        }
        toast({
          title:
            variations.length > 1
              ? `${variations.length} variaciones asignadas`
              : "Variación asignada al ítem",
          variant: "success",
        });
      }

      onSelected(variations);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: err.message ?? "Error al asignar el producto", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /** Selector de grupo + término, igual en "new" y en "variation". */
  /** Lista de atributos: cada fila dice a qué grupo pertenece su término. */
  /**
   * Categorías y etiquetas de la prenda, con alta en línea.
   *
   * El mismo bloque en los tres modos, y a propósito: la clasificación es del
   * PRODUCTO, así que da igual si se está creando, buscando una prenda o
   * añadiéndole una talla — en los tres casos hay un producto detrás al que
   * clasificar, y este es el momento en que se está pensando en él.
   *
   * Antes solo salía al crear, y para el resto había un «+» en la tabla de
   * ítems que abría otro diálogo: dos sitios para lo mismo.
   */
  /**
   * La foto del producto.
   *
   * Va aquí y no solo en Productos porque es donde se está mirando la prenda,
   * y porque de aquí sale a la Orden de Producción: sin foto, el papel que
   * llega al taller no tiene referencia visual de lo que hay que hacer.
   *
   * Es del PRODUCTO, no de la talla: `variation_images` solo reparte esas
   * mismas fotos entre las variaciones.
   */
  /**
   * Las previsualizaciones de lo que aún no se ha subido.
   *
   * Fuera del render: `createObjectURL` en el cuerpo del componente devolvía
   * una url nueva en cada pintado --la miniatura parpadeaba-- y ninguna se
   * liberaba nunca. Aquí se crea una por fichero y se revoca al cambiar la
   * lista o al cerrar.
   */
  const pendingPreviews = useMemo(
    () => pendingImages.map((file) => URL.createObjectURL(file)),
    [pendingImages]
  );

  useEffect(
    () => () => pendingPreviews.forEach((url) => URL.revokeObjectURL(url)),
    [pendingPreviews]
  );

  /**
   * Quitar una foto del producto.
   *
   * Se va de la prenda y de sus tallas: `variation_images` solo reparte estas
   * mismas fotos, así que dejarla repartida sin la foto no tendría sentido.
   */
  const handleRemoveImage = async (imageId: number) => {
    const antes = productImages;
    // Optimista: la rejilla responde al instante y se repone si falla. Borrar
    // una foto y quedarse mirando una que ya no está es peor que el riesgo.
    setProductImages((prev) => prev.filter((image) => image.id !== imageId));
    try {
      await deleteProductImageApi(imageId);
    } catch {
      setProductImages(antes);
      toast({ title: "No se pudo quitar la imagen", variant: "destructive" });
    }
  };

  const handleRemovePending = (index: number) =>
    setPendingImages((prev) => prev.filter((_, i) => i !== index));

  /**
   * Reordenar arrastrando, con el mismo gesto que la ficha de producto.
   *
   * El orden IMPORTA: la primera es la que sale como referencia en la Orden de
   * Producción. Se reordena en pantalla mientras se arrastra y se guarda al
   * soltar, no en cada paso -- si no, cruzar una foto sobre otras tres dispara
   * cuatro guardados.
   */
  const reordenarGuardadas = (arrastradaId: number, destinoId: number) => {
    if (arrastradaId === destinoId) return;
    setProductImages((prev) => {
      const orden = [...prev].sort((a, b) => a.order - b.order);
      const desde = orden.findIndex((image) => image.id === arrastradaId);
      const hasta = orden.findIndex((image) => image.id === destinoId);
      if (desde === -1 || hasta === -1) return prev;
      const [movida] = orden.splice(desde, 1);
      orden.splice(hasta, 0, movida);
      return orden.map((image, index) => ({ ...image, order: index }));
    });
  };

  const reordenarPendientes = (desde: number, hasta: number) => {
    if (desde === hasta) return;
    setPendingImages((prev) => {
      const orden = [...prev];
      const [movida] = orden.splice(desde, 1);
      orden.splice(hasta, 0, movida);
      return orden;
    });
  };

  /** Al soltar: se persiste el orden que quedó en pantalla. */
  const guardarOrden = async () => {
    setDraggedKey(null);
    if (productImages.length === 0) return;
    try {
      await reorderProductImagesApi(
        [...productImages]
          .sort((a, b) => a.order - b.order)
          .map((image) => image.id)
      );
    } catch {
      toast({
        title: "No se pudo guardar el orden de las imágenes",
        variant: "destructive",
      });
    }
  };

  /**
   * La galería del producto, con la misma forma que la ficha de producto:
   * zona punteada con «Seleccionar imágenes», rejilla de tres en cuadrado, la
   * «x» al pasar por encima y el número de orden en la esquina.
   *
   * Y arrastrando se reordena, que es lo que decide cuál sale como referencia
   * en la Orden de Producción: la primera.
   *
   * Guardadas y pendientes no se mezclan porque no coinciden: con producto ya
   * creado el fichero sube al elegirlo, y sin producto --al crear-- no hay
   * dónde subirlo y todas esperan. Cada lista se reordena a su manera: las
   * guardadas contra la base, las pendientes en el array que se subirá.
   */
  const imageEditor = (productId: number | null) => {
    const guardadas = [...productImages].sort((a, b) => a.order - b.order);
    const total = guardadas.length + pendingImages.length;

    const miniatura = (
      key: string,
      src: string,
      posicion: number,
      pendiente: boolean,
      onRemove: () => void,
      dnd: {
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragEnd: () => void;
      }
    ) => (
      <div
        key={key}
        className={cn(
          "group relative aspect-square cursor-move select-none",
          draggedKey === key && "opacity-50"
        )}
        draggable
        onDragStart={dnd.onDragStart}
        onDragOver={dnd.onDragOver}
        onDragEnd={dnd.onDragEnd}
      >
        <img
          src={src}
          alt="Producto"
          draggable={false}
          className={cn(
            "pointer-events-none h-full w-full rounded-lg border object-cover",
            // Punteada la que aún no existe: si el alta falla, no está.
            pendiente && "border-dashed"
          )}
        />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute right-1 top-1 z-10 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label="Quitar imagen"
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {posicion}
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        <Label>Imágenes del producto</Label>

        {/* Soltar ficheros encima también vale, igual que en la ficha. */}
        <div
          onDragOver={(event) => {
            // Solo para FICHEROS: arrastrando una miniatura para reordenar no
            // se debe encender la zona de soltar.
            if (draggedKey !== null) return;
            event.preventDefault();
            if (!uploadingImage) setIsDraggingFiles(true);
          }}
          onDragLeave={() => setIsDraggingFiles(false)}
          onDrop={(event) => {
            if (draggedKey !== null) return;
            event.preventDefault();
            setIsDraggingFiles(false);
            const files = Array.from(event.dataTransfer.files ?? []).filter(
              (file) => file.type.startsWith("image/")
            );
            void handlePickImages(files, productId);
          }}
          className={cn(
            "rounded-lg border-2 border-dashed transition-colors",
            isDraggingFiles ? "border-primary bg-primary/5" : "border-transparent"
          )}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              // Se limpia para que elegir el mismo fichero dos veces vuelva a
              // disparar el change.
              event.target.value = "";
              void handlePickImages(files, productId);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploadingImage
              ? "Subiendo..."
              : isDraggingFiles
                ? "Soltar imágenes aquí"
                : "Seleccionar imágenes"}
          </Button>
        </div>

        {total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {guardadas.map((image, index) =>
              miniatura(
                `img-${image.id}`,
                image.url,
                index + 1,
                false,
                () => void handleRemoveImage(image.id),
                {
                  onDragStart: (event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedKey(`img-${image.id}`);
                  },
                  onDragOver: (event) => {
                    event.preventDefault();
                    if (!draggedKey?.startsWith("img-")) return;
                    reordenarGuardadas(
                      Number(draggedKey.slice(4)),
                      image.id
                    );
                  },
                  onDragEnd: () => void guardarOrden(),
                }
              )
            )}

            {pendingImages.map((file, index) =>
              miniatura(
                `pending-${index}`,
                pendingPreviews[index],
                guardadas.length + index + 1,
                true,
                () => handleRemovePending(index),
                {
                  onDragStart: (event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedKey(`pending-${index}`);
                  },
                  onDragOver: (event) => {
                    event.preventDefault();
                    if (!draggedKey?.startsWith("pending-")) return;
                    reordenarPendientes(Number(draggedKey.slice(8)), index);
                    setDraggedKey(`pending-${index}`);
                  },
                  onDragEnd: () => setDraggedKey(null),
                }
              )
            )}
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          {total === 0
            ? "Sin imágenes. La Orden de Producción saldrá sin referencia visual."
            : `${total} ${total === 1 ? "imagen" : "imágenes"} · arrastra para ` +
              `ordenarlas; la primera es la que sale en la Orden de Producción` +
              `${pendingImages.length > 0 ? ", y las punteadas se suben al crear el producto" : ""}.`}
        </p>
      </div>
    );
  };

  const taxonomyEditor = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Categorías</Label>
        {/* Las mismas casillas con sangría que la ficha de producto, en vez
            del desplegable que había aquí: el árbol se lee de un vistazo y se
            ve de quién cuelga cada una. El alto tope evita que un catálogo
            largo empuje el resto del formulario. */}
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
          {categoriasJerarquicas.length === 0 ? (
            <p className="text-muted-foreground p-1 text-xs">
              Todavía no hay categorías.
            </p>
          ) : (
            categoriasJerarquicas.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2"
                style={{ paddingLeft: `${category.level * 16}px` }}
              >
                <Checkbox
                  className="shrink-0"
                  id={`item-category-${category.id}`}
                  checked={selectedCategoryIds.includes(String(category.id))}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                {/* min-w-0 en el span y no solo en el Label: un elemento flex
                    nace con `min-width: auto` y NO encoge por debajo de su
                    texto, asi que sin el el truncate no llega a aplicarse
                    nunca y un nombre largo ensancha el dialogo entero. */}
                <Label
                  htmlFor={`item-category-${category.id}`}
                  className="flex min-w-0 cursor-pointer items-center gap-1 text-sm font-normal"
                  title={category.name}
                >
                  {category.level > 0 && (
                    <span className="text-muted-foreground shrink-0 text-xs">└</span>
                  )}
                  <span className="min-w-0 truncate">{category.name}</span>
                </Label>
              </div>
            ))
          )}
        </div>
        {/* Crear la que falta sin salir: encontrarse con que no existe
            obligaba a irse a Productos y volver a empezar el ítem. El mismo
            componente que la ficha, que es el que trae la categoría padre.

            Sin `disabled`: ahí esa prop significa «no lo pintes» --es como la
            ficha esconde el alta en modo lectura--, no «está ocupado». */}
        <CategoryQuickAddForm
          categories={categoryOptions}
          onCreate={handleCreateCategory}
        />
      </div>
      <div className="space-y-2">
        <Label>Etiquetas</Label>
        {/* Las mismas casillas que las categorías, en vez del combobox que
            había aquí. Elegir categoría y elegir etiqueta son la misma
            decisión --clasificar la prenda-- y estaban una al lado de la otra
            con dos formas distintas de hacerse: en una se marcaba de una
            lista, en la otra había que teclear para que aparecieran.

            Sin sangría ni «└»: las etiquetas no cuelgan de nada. */}
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
          {tagOptions.length === 0 ? (
            <p className="text-muted-foreground p-1 text-xs">
              Todavía no hay etiquetas.
            </p>
          ) : (
            tagOptions.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  className="shrink-0"
                  id={`item-tag-${tag.id}`}
                  checked={selectedTagIds.includes(String(tag.id))}
                  onCheckedChange={() => toggleTag(tag.id)}
                />
                <Label
                  htmlFor={`item-tag-${tag.id}`}
                  className="min-w-0 cursor-pointer text-sm font-normal"
                  title={tag.name}
                >
                  <span className="block truncate">{tag.name}</span>
                </Label>
              </div>
            ))
          )}
        </div>
        {/* El mismo «+ Agregar» de las categorías. `handleCreateTag` ya deja
            marcada la que se crea, así que aparece elegida arriba sola. */}
        <TagQuickAddForm onCreate={handleCreateTag} />
      </div>
    </div>
  );

  const attributesEditor = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Atributos de la variación *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={addAttribute}
          disabled={usedGroups.size >= termGroups.length}
        >
          <Plus className="w-4 h-4" />
          Añadir atributo
        </Button>
      </div>

      {attributes.map((row, index) => (
        <div key={index} className="flex gap-2">
          <div className="flex-1">
            <Select
              value={row.termGroupId}
              onValueChange={(value) => setAttributeGroup(index, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                {termGroups
                  // Un grupo ya usado en otra fila no se vuelve a ofrecer:
                  // una variación no puede llevar Talla dos veces.
                  .filter(
                    (group) =>
                      String(group.id) === row.termGroupId ||
                      !usedGroups.has(String(group.id))
                  )
                  .map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            {/* Varios términos por fila: marcar S, M, L y XL de una vez crea
                las cuatro tallas en la misma pasada. */}
            <MultiSelect
              options={termsOfRow(row.termGroupId).map((term) => ({
                value: String(term.id),
                label: term.name,
              }))}
              value={row.termIds}
              onChange={(value) => setAttributeTerms(index, value)}
              placeholder="Seleccionar términos"
              disabled={!row.termGroupId}
              showSelectAll
              selectAllLabel="Todos"
              maxVisible={4}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => removeAttribute(index)}
            disabled={attributes.length === 1}
            aria-label="Quitar atributo"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Lo que va a salir, antes de confirmar: con varios términos el
          número de variaciones deja de ser obvio (2 tallas × 3 colores = 6). */}
      {combinations.length > 1 && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="mb-2 font-medium">
            Se crearán {combinations.length} variaciones
          </p>
          <div className="flex flex-wrap gap-1.5">
            {combinations.map((combo, i) => (
              <span
                key={i}
                className="rounded-md border bg-background px-2 py-0.5 text-xs"
              >
                {comboLabel(combo)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Flex en columna con tope de alto: el cuerpo rueda por dentro y la
          cabecera y el pie se quedan. Ancho 5xl porque el cuerpo son ahora dos
          columnas -- los datos y, al lado, las fotos. */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {linkedVariationId ? "Prenda del ítem" : "Producto del ítem"}
          </DialogTitle>
          <DialogDescription>
            {linkedVariationId
              ? "Revisa o completa lo que le falte —clasificación, fotos—, o busca otra para reemplazarla."
              : "La prenda que sale de este ítem. Es lo que recibe el stock al cerrar la orden y sobre lo que se calcula su costo."}
          </DialogDescription>
        </DialogHeader>

        {/* Las tres opciones, ARRIBA, en fila y FUERA del scroll.

            En fila porque apiladas se comian tres tarjetas de alto --unos
            140 px-- antes de llegar a lo que se viene a hacer, que es elegir
            la prenda. Y fuera del scroll porque son el interruptor de modo:
            tener que rodar hacia arriba para cambiar de opción sería al revés
            de como se usa. */}
        <RadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {(
            [
              ["existing", "Vincular uno que ya existe"],
              ["variation", "Añadir una talla a un producto ya creado"],
              ["new", "Crear el producto"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "flex items-start gap-2 rounded-md border p-2.5 cursor-pointer",
                mode === value && "border-primary bg-muted/40"
              )}
            >
              <RadioGroupItem value={value} className="mt-0.5" />
              <span className="text-xs font-medium leading-snug">{label}</span>
            </label>
          ))}
        </RadioGroup>

        {/* QUE prenda es: el buscador --o el nombre, al crear-- por encima de
            las DOS columnas.

            Vivia dentro de la columna izquierda, y ahi no pertenece: lo que se
            elige aqui manda sobre las dos --de la prenda cuelgan tanto los
            datos de abajo como las fotos de la derecha-- y quedaba a la altura
            de un campo mas de la izquierda, como si solo la afectara a ella.

            Fuera del scroll por lo mismo que el selector de modo: tener que
            rodar hacia arriba para cambiar de prenda seria al reves de como se
            usa. Y en el mismo sitio en los tres modos, asi que cambiar de
            opcion ya no mueve el campo de sitio. */}
        <div className="shrink-0">
          {mode === "existing" && (
            <div className="space-y-2">
              <Label>Prenda</Label>
              {/* El mismo buscador que el de los movimientos de inventario,
                  pero SIN el stock: aqui la prenda no se elige por lo que hay
                  en almacen -- se va a producir precisamente porque no hay. */}
              <ProductVariationSelector
                showStock={false}
                onSelect={handleVariationPicked}
                trigger={
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start overflow-hidden font-normal"
                  >
                    {loadingVariation ? (
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {selectedVariation?.label ?? "Buscar por nombre o SKU..."}
                    </span>
                  </Button>
                }
              />
              {selectedVariation && (
                <p className="text-muted-foreground text-xs">
                  SKU {selectedVariation.sku ?? "—"}
                </p>
              )}
            </div>
          )}
          {mode === "variation" && (
            <div className="space-y-2">
              <Label>Producto</Label>
              {/* El mismo buscador que en «vincular uno que ya existe», pero
                  en modo PRODUCTO: aquí no se elige una talla, se elige a qué
                  producto añadirle una. */}
              <ProductVariationSelector
                mode="product"
                showStock={false}
                onSelect={handleProductPicked}
                trigger={
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start overflow-hidden font-normal"
                  >
                    {loadingProduct ? (
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {selectedProduct?.title ?? "Buscar producto..."}
                    </span>
                  </Button>
                }
              />
              {selectedProduct && !selectedProduct.isVariable && (
                <p className="text-warning text-xs">
                  Este producto es simple: al añadirle una talla pasa a ser
                  variable.
                </p>
              )}
            </div>
          )}
          {mode === "new" && (
            <div className="space-y-2">
              <Label>Nombre del producto *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Chompa Overtake Fire"
              />
            </div>
          )}
        </div>

        {/* El cuerpo.

            Era un envoltorio `flex-1 overflow-hidden` con una fila `h-full`
            dentro, y ese `h-full` NO resolvia: su padre es un elemento flex
            cuya altura sale del reparto, no de una altura declarada, asi que
            el 100% se quedaba en `auto`. Resultado: las dos columnas crecian
            hasta su contenido, `overflow-y-auto` no tenia nada que desplazar y
            el envoltorio recortaba el resto. Con muchas fotos, las ultimas no
            habia forma de verlas.

            Ahora la fila ES el elemento flex --sin envoltorio--, asi que su
            altura si es definida y las columnas desplazan de verdad. Y por
            debajo de `lg`, donde se apilan, desplaza el bloque entero: dos
            columnas apiladas con scroll propio cada una dejaban la de abajo
            sin sitio. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:flex-row lg:overflow-hidden">
            {/* Los datos, a la izquierda y con su propio scroll. */}
            <div className="min-w-0 shrink-0 space-y-4 lg:min-h-0 lg:flex-1 lg:shrink lg:overflow-y-auto lg:pr-1">
          {/* Una prenda que ya existe también se puede clasificar aquí: sale
              cargada con lo que tiene y se le suma lo que falte. Su foto vive
              en la columna de la derecha, y el buscador, arriba. */}
          {mode === "existing" && selectedVariation && taxonomyEditor}

          {mode === "variation" && (
            <div className="space-y-4">
              {/* TODO lo demás espera al producto.

                  Los atributos salían antes de elegirlo, y eso invitaba a
                  empezar por el final: se escogía la talla y solo después a
                  qué producto añadírsela, sin haber visto las que ya tiene.
                  Ahora primero se busca, y lo que se va a añadir se decide
                  abajo del todo, con las que ya existen a la vista. */}
              {selectedProduct && (
                <>
                  {taxonomyEditor}

                  {/* Las que YA tiene. Es lo que evita pedir una repetida, y
                      lo que dice de un vistazo por dónde va el producto. */}
                  <div className="space-y-2">
                    <Label>Tallas que ya tiene</Label>
                    {existingVariations.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        Ninguna todavía: esta sería la primera.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {existingVariations.map((variation) => (
                          <Badge
                            key={variation.id}
                            variant="secondary"
                            title={variation.sku ?? undefined}
                          >
                            {/* Sin términos es un producto simple que todavía
                                no se ha abierto por tallas: se nombra por su
                                SKU, que es lo único que lo distingue. */}
                            {variation.terms.length > 0
                              ? variation.terms.join(" / ")
                              : (variation.sku ?? `#${variation.id}`)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {attributesEditor}
                  <p className="text-sm text-muted-foreground">
                    Si alguna combinación de atributos ya existe en el producto,
                    se reutiliza en vez de duplicarla.
                  </p>
                </>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-4">
              {taxonomyEditor}
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Con variación</p>
                  <p className="text-sm text-muted-foreground">
                    Actívalo si la prenda va por tallas o colores.
                  </p>
                </div>
                <Switch checked={hasVariation} onCheckedChange={setHasVariation} />
              </div>
              {hasVariation && attributesEditor}
            </div>
          )}
            </div>

            {/* Las fotos, en su columna a la derecha. Una sola vez para los
                tres modos: lo único que cambia entre ellos es de qué producto
                cuelgan --la variación vinculada, el producto elegido, o
                ninguno todavía al crear--. */}
            <div className="w-full shrink-0 space-y-2 lg:w-72 lg:min-h-0 lg:overflow-y-auto">
              {mode === "existing" && !selectedVariation ? (
                <p className="text-muted-foreground text-xs">
                  Elige una prenda para ver y añadir sus fotos.
                </p>
              ) : mode === "variation" && !selectedProduct ? (
                <p className="text-muted-foreground text-xs">
                  Elige un producto para ver y añadir sus fotos.
                </p>
              ) : (
                imageEditor(
                  mode === "existing"
                    ? (selectedVariation?.productId ?? null)
                    : mode === "variation"
                      ? (selectedProduct?.id ?? null)
                      : null,
                )
              )}
            </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              combinations.length > 1 && mode !== "existing"
                ? `Asignar ${combinations.length} variaciones`
                : "Asignar al ítem"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
