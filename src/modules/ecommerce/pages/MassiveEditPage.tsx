import { Button } from "@/components/ui/button";
import { useState } from "react";
import MassiveEditProductsTable from "@/modules/ecommerce/components/MassiveEditProductsTable";
import ProductsFilterModal from "@/modules/products/components/products/ProductsFilterModal";
import { useProducts } from "@/modules/products/hooks/useProducts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ProductsFilterBar from "@/modules/products/components/products/ProductsFilterBar";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import {
  updatePromotionalTextApi,
  updateSizeImagesApi,
  updateShortDescriptionApi,
  updateSalesChannelsApi,
  updateLargeDescriptionApi,
  updatePromotionalImageApi,
  updateOtherDescriptionMinApi,
  updateOtherDescriptionMayApi,
  assignMassiveTagsApi,
  unassignMassiveTagsApi,
  assignMassiveBrandsApi,
  type MassiveBrandsMode,
} from "@/modules/products/services/products.service";
import AssignTagsModal, {
  type TagMassiveMode,
} from "@/modules/ecommerce/components/AssignTagsModal";
import AssignBrandsModal from "@/modules/ecommerce/components/AssignBrandsModal";
import PromotionalTextModal from "@/modules/ecommerce/components/PromotionalTextModal";
import SizeImagesModal from "@/modules/ecommerce/components/SizeImagesModal";
import ShortDescriptionModal from "@/modules/ecommerce/components/DescriptionModal";
import SalesChannelsModal from "@/modules/ecommerce/components/SalesChannelsModal";
import OtherDescriptionMinModal from "@/modules/ecommerce/components/OtherDescriptionMinModal";
import OtherDescriptionMayModal from "@/modules/ecommerce/components/OtherDescriptionMayModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  Tag,
  Tags,
  Bookmark,
  Ruler,
  Image,
  AlignLeft,
  AlignRight,
  Radio,
  ShieldCheck,
} from "lucide-react";
import ShortDescriptionMayModal from "../components/DescriptionMaYModal";
import PromotionalImageModal from "../components/PromotionalImage";
import EcommerceEditorButton from "@/shared/components/EcommerceEditorButton";
import { ComponentPermission } from "@/shared/components/component-permission";
import { toastError } from "@/shared/utils/toastError";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MassiveEditVariationsTable from "@/modules/ecommerce/components/MassiveEditVariationsTable";
import MinimumStockModal from "@/modules/ecommerce/components/MinimumStockModal";
import { useVariationsMinStock } from "@/modules/ecommerce/hooks/useVariationsMinStock";


const PromotionalTextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSizeImagesModalOpen, setIsSizeImagesModalOpen] = useState(false);
  const [isShortDescModalOpen, setIsShortDescModalOpen] = useState(false);
  const [isShortDesMayModalOpen, setIsShortDesMayModalOpen] = useState(false);
  const [isPromotionalImageModal, setIsPromotionalImageModal] = useState(false);
  const [isOtherDescMinModalOpen, setIsOtherDescMinModalOpen] = useState(false);
  const [isOtherDescMayModalOpen, setIsOtherDescMayModalOpen] = useState(false);
  const [isSalesChannelsModalOpen, setIsSalesChannelsModalOpen] =
    useState(false);
  const [isAssignTagsOpen, setIsAssignTagsOpen] = useState(false);
  const [isAssignBrandsOpen, setIsAssignBrandsOpen] = useState(false);
  // T-596: la pestaña de variaciones trabaja por SKU, así que tiene su propio
  // hook, su propia selección y su propia acción. La de productos no cambia.
  const [isMinimumStockOpen, setIsMinimumStockOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("productos");
  const { toast } = useToast();

  const {
    products,
    selectedCategories,
    setSelectedCategories,
    tags,
    brands,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    selectedProducts,
    hasActiveFilters,
    handlePageSizeChange,
    toggleSelectAll,
    toggleProductSelection,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onPageChange,
    onSearchChange,
    onOrderChange,
  } = useProducts();

  const {
    variations,
    defaultMinStock,
    channel: wholesaleChannel,
    selectedCategories: variationCategories,
    setSelectedCategories: setVariationCategories,
    tags: variationTags,
    brands: variationBrands,
    terms,
    loading: loadingVariations,
    search: variationSearch,
    filters: variationFilters,
    pagination: variationPagination,
    isOpenFilterModal: isOpenVariationFilterModal,
    selectedVariations,
    hasActiveFilters: hasActiveVariationFilters,
    onSearchChange: onVariationSearchChange,
    onPageChange: onVariationPageChange,
    onOrderChange: onVariationOrderChange,
    handlePageSizeChange: handleVariationPageSizeChange,
    onOpenFilterModal: onOpenVariationFilterModal,
    onCloseFilterModal: onCloseVariationFilterModal,
    onApplyFilter: onApplyVariationFilter,
    toggleSelectAll: toggleAllVariations,
    toggleVariationSelection,
    saveMinStock,
  } = useVariationsMinStock();

  const noSelectionToast = (label: string) => {
    toast({
      title: "Sin productos seleccionados",
      description: `Selecciona al menos un producto para ${label}.`,
      variant: "destructive",
    });
  };

  const plural = (n: number) => `${n} producto${n > 1 ? "s" : ""}`;

  const handleSavePromo = async (
    promoText: string,
    bgColor: string,
    textColor: string,
  ) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("aplicar el texto promocional");
      return;
    }
    await updatePromotionalTextApi(
      selectedProducts,
      promoText,
      bgColor,
      textColor,
    );
    toast({
      title: "Guardado exitoso",
      description: `Texto promocional aplicado a ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  const handleSaveSizeImages = async (
    sizesImageUrl: string | null,
    sizesRefImageUrl: string | null,
  ) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("actualizar las imágenes de tallas");
      return;
    }
    await updateSizeImagesApi(
      selectedProducts,
      sizesImageUrl,
      sizesRefImageUrl,
    );
    toast({
      title: "Guardado exitoso",
      description: `Imágenes de tallas actualizadas en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  const handleSavePromotionalImage = async (
    promotionalImgUrl: string | null,
  ) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("actualizar la imagen promocional");
      return;
    }
    await updatePromotionalImageApi(selectedProducts, promotionalImgUrl);
    toast({
      title: "Guardado exitoso",
      description: `Imagen promocional actualizada en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  const handleSaveShortDescription = async (shortDescription: string) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("No hay productos seleccionados");
      return;
    }
    await updateShortDescriptionApi(selectedProducts, shortDescription);
    toast({
      title: "Guardado exitoso", //7
      description: `Descripción corta actualizada en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };
  const handleSaveShortDescriptionMay = async (shortDescription: string) => {
    //5
    if (selectedProducts.length === 0) {
      noSelectionToast("No hay productos seleccionados");
      return;
    }
    await updateLargeDescriptionApi(selectedProducts, shortDescription);
    toast({
      title: "Guardado exitoso", //7
      description: `Descripción corta actualizada en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  const handleSaveOtherDescriptionMin = async (description: string) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("No hay productos seleccionados");
      return;
    }
    await updateOtherDescriptionMinApi(selectedProducts, description);
    toast({
      title: "Guardado exitoso",
      description: `Otra descripción min. actualizada en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  const handleSaveOtherDescriptionMay = async (description: string) => {
    if (selectedProducts.length === 0) {
      noSelectionToast("No hay productos seleccionados");
      return;
    }
    await updateOtherDescriptionMayApi(selectedProducts, description);
    toast({
      title: "Guardado exitoso",
      description: `Otra descripción may. actualizada en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };


  const handleSaveTags = async (tagIds: number[], mode: TagMassiveMode) => {
    const isUnassign = mode === "unassign";

    if (selectedProducts.length === 0) {
      noSelectionToast(isUnassign ? "desasignar etiquetas" : "asignar etiquetas");
      return;
    }

    try {
      if (isUnassign) {
        const result = await unassignMassiveTagsApi(selectedProducts, tagIds);

        if (result.deleted === 0) {
          toast({
            title: "Sin cambios",
            description: `${plural(selectedProducts.length)} no tenían esas etiquetas asignadas.`,
            variant: "info",
          });
        } else {
          toast({
            title: "Etiquetas desasignadas",
            description:
              `Se quitaron ${result.deleted} asignación${result.deleted === 1 ? "" : "es"} en ${plural(selectedProducts.length)}.` +
              (result.notFound > 0
                ? ` ${result.notFound} no existían y se omitieron.`
                : ""),
            variant: "success",
          });
        }
      } else {
        const result = await assignMassiveTagsApi(selectedProducts, tagIds);

        if (result.created === 0) {
          toast({
            title: "Sin cambios",
            description: `${plural(selectedProducts.length)} ya tenían esas etiquetas (${result.skipped} asignación${result.skipped === 1 ? "" : "es"} omitida${result.skipped === 1 ? "" : "s"}).`,
            variant: "info",
          });
        } else {
          toast({
            title: "Etiquetas asignadas",
            description:
              `Se agregaron ${result.created} asignación${result.created === 1 ? "" : "es"} en ${plural(selectedProducts.length)}.` +
              (result.skipped > 0
                ? ` ${result.skipped} ya existían y se omitieron.`
                : ""),
            variant: "success",
          });
        }
      }
    } catch (error) {
      toastError(error, "Error desconocido");
      throw error;
    }
  };

  const handleSaveBrands = async (
    brandIds: number[],
    mode: MassiveBrandsMode,
  ) => {
    const isUnassign = mode === "unassign";

    if (selectedProducts.length === 0) {
      noSelectionToast(isUnassign ? "desasignar marcas" : "asignar marcas");
      return;
    }

    try {
      const result = await assignMassiveBrandsApi(selectedProducts, brandIds, mode);

      if (isUnassign) {
        if (result.removed === 0) {
          toast({
            title: "Sin cambios",
            description: `${plural(selectedProducts.length)} no tenían esas marcas asignadas.`,
            variant: "info",
          });
        } else {
          toast({
            title: "Marcas desasignadas",
            description: `Se quitaron ${result.removed} asignación${result.removed === 1 ? "" : "es"} en ${plural(selectedProducts.length)}.`,
            variant: "success",
          });
        }
      } else if (result.created === 0) {
        toast({
          title: "Sin cambios",
          description: `${plural(selectedProducts.length)} ya tenían esas marcas (${result.skipped} asignación${result.skipped === 1 ? "" : "es"} omitida${result.skipped === 1 ? "" : "s"}).`,
          variant: "info",
        });
      } else {
        toast({
          title: "Marcas asignadas",
          description:
            `Se agregaron ${result.created} asignación${result.created === 1 ? "" : "es"} en ${plural(selectedProducts.length)}.` +
            (result.skipped > 0
              ? ` ${result.skipped} ya existían y se omitieron.`
              : ""),
          variant: "success",
        });
      }
    } catch (error) {
      toastError(error, "Error desconocido");
      throw error;
    }
  };

  // T-596 · minStock null = "volver al valor por defecto" (borra las filas);
  // un número = se reserva esa cantidad, y 0 es no proteger la variación.
  const handleSaveMinimumStock = async (minStock: number | null) => {
    if (selectedVariations.length === 0) {
      toast({
        title: "Sin variaciones seleccionadas",
        description: "Selecciona al menos una variación para configurar el stock mínimo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveMinStock(minStock);

      toast({
        title: minStock === null ? "Stock mínimo restablecido" : "Stock mínimo guardado",
        description:
          minStock === null
            ? `${result.cleared} variación${result.cleared === 1 ? "" : "es"} vuelve${result.cleared === 1 ? "" : "n"} al valor por defecto.`
            : `Se reservan ${minStock} unidad${minStock === 1 ? "" : "es"} en ${result.upserted} variación${result.upserted === 1 ? "" : "es"}.`,
        variant: "success",
      });
    } catch (error) {
      toastError(error, "Error desconocido");
      throw error;
    }
  };

  const handleSaveSalesChannels = async (channelIds: number[]) => {
    //la funcion que se ejecuta al guardar
    if (selectedProducts.length === 0) {
      noSelectionToast("actualizar los canales de venta");
      return;
    }
    await updateSalesChannelsApi(selectedProducts, channelIds);
    toast({
      title: "Guardado exitoso",
      description: `Canales de venta actualizados en ${plural(selectedProducts.length)}.`,
      variant: "success",
    });
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edición masiva</h1>
          <p className="text-gray-600">Gestiona y actualiza los productos del ecommerce</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Abre el editor de la tienda pública vía SSO, en otra pestaña: es
              otra herramienta, no una edición de productos, de ahí su propio
              code. */}
          <ComponentPermission codeIn={["ecommerce_editor.open"]}>
            <EcommerceEditorButton variant="outline" />
          </ComponentPermission>
          {/* T-596 · La acción de la pestaña de variaciones: un valor para
              todas las seleccionadas. Mismo code que el resto de la edición
              masiva. */}
          {activeTab === "variaciones" && (
            <ComponentPermission codeIn={["products.edit"]}>
              <Button
                className="gap-2"
                disabled={selectedVariations.length === 0}
                onClick={() => setIsMinimumStockOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" />
                Configurar stock mínimo
              </Button>
            </ComponentPermission>
          )}
          {/* Las diez opciones del menú escriben propiedades del producto
              (descripciones, imágenes, canales, etiquetas, marcas), solo que en
              lote: cuelgan del mismo products.edit que la ficha individual. */}
          {activeTab === "productos" && (
          <ComponentPermission codeIn={["products.edit"]}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-2"
                  disabled={selectedProducts.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Edicion masiva
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Tag className="w-4 h-4" />
                  Texto Promocional
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsSizeImagesModalOpen(true)}
                >
                  <Ruler className="w-4 h-4" />
                  Imágenes de Tallas
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsPromotionalImageModal(true)}
                >
                  <Image className="w-4 h-4" />
                  Imágenes Promocionales
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsShortDesMayModalOpen(true)}
                >
                  <AlignLeft className="w-4 h-4" />
                  Descripción Mayorista
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsShortDescModalOpen(true)}
                >
                  <AlignRight className="w-4 h-4" />
                  Descripción Minorista
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsOtherDescMinModalOpen(true)}
                >
                  <AlignRight className="w-4 h-4" />
                  Otra descripción min.
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsOtherDescMayModalOpen(true)}
                >
                  <AlignLeft className="w-4 h-4" />
                  Otra descripción may.
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsSalesChannelsModalOpen(true)}
                >
                  <Radio className="w-4 h-4" />
                  Canales de Venta
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsAssignTagsOpen(true)}
                >
                  <Tags className="w-4 h-4" />
                  Etiquetas
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setIsAssignBrandsOpen(true)}
                >
                  <Bookmark className="w-4 h-4" />
                  Marcas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ComponentPermission>
          )}
        </div>
      </div>

      {/* Dos vistas de lo mismo con distinto registro: la de siempre, por
          producto, y la de variaciones (T-596), por SKU, que es la única forma
          de configurar un mínimo que se guarda por variation_id. */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0 gap-4"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="variaciones">Variaciones</TabsTrigger>
        </TabsList>

        <TabsContent
          value="productos"
          className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
        >
          <Card className="flex flex-col h-full min-h-0 overflow-hidden">
            <CardHeader className="!p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ProductsFilterBar
                  search={search}
                  onSearchChange={onSearchChange}
                  onOpen={onOpenFilterModal}
                  order={filters.order}
                  onOrderChange={onOrderChange}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
              <MassiveEditProductsTable
                search={search}
                products={products}
                loading={loading}
                selectedProducts={selectedProducts}
                onToggleAllProductsSelection={toggleSelectAll}
                onToggleProductSelection={toggleProductSelection}
              />
            </CardContent>

            <CardFooter className="!p-0">
              <PaginationBar
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="variaciones"
          className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
        >
          <Card className="flex flex-col h-full min-h-0 overflow-hidden">
            <CardHeader className="!p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ProductsFilterBar
                  search={variationSearch}
                  onSearchChange={onVariationSearchChange}
                  onOpen={onOpenVariationFilterModal}
                  order={variationFilters.order}
                  onOrderChange={onVariationOrderChange}
                  hasActiveFilters={hasActiveVariationFilters}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {wholesaleChannel
                  ? `Stock mínimo de ${wholesaleChannel.name}`
                  : "Canal de la web mayorista no encontrado"}
                {defaultMinStock !== null
                  ? ` · por defecto ${defaultMinStock} unidades`
                  : " · sin valor por defecto"}
              </p>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
              <MassiveEditVariationsTable
                search={variationSearch}
                variations={variations}
                loading={loadingVariations}
                defaultMinStock={defaultMinStock}
                selectedVariations={selectedVariations}
                onToggleAllVariationsSelection={toggleAllVariations}
                onToggleVariationSelection={toggleVariationSelection}
              />
            </CardContent>

            <CardFooter className="!p-0">
              <PaginationBar
                pagination={variationPagination}
                onPageChange={onVariationPageChange}
                onPageSizeChange={handleVariationPageSizeChange}
              />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        selectedCategories={selectedCategories}
        onChangeSelectedCategories={setSelectedCategories}
        tags={tags}
        brands={brands}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />

      {/* Mismo modal de filtros, con el select de atributo que solo se pinta
          cuando se le pasan términos. */}
      <ProductsFilterModal
        isOpen={isOpenVariationFilterModal}
        selectedCategories={variationCategories}
        onChangeSelectedCategories={setVariationCategories}
        tags={variationTags}
        brands={variationBrands}
        terms={terms}
        filters={variationFilters}
        onClose={onCloseVariationFilterModal}
        onApply={onApplyVariationFilter}
      />

      <MinimumStockModal
        isOpen={isMinimumStockOpen}
        onClose={() => setIsMinimumStockOpen(false)}
        selectedCount={selectedVariations.length}
        channelName={wholesaleChannel?.name ?? null}
        defaultMinStock={defaultMinStock}
        onSave={handleSaveMinimumStock}
      />
      <PromotionalTextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSavePromo}
      />
      <SizeImagesModal
        isOpen={isSizeImagesModalOpen}
        onClose={() => setIsSizeImagesModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveSizeImages}
      />
      <PromotionalImageModal
        isOpen={isPromotionalImageModal}
        onClose={() => setIsPromotionalImageModal(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSavePromotionalImage}
      />
      <ShortDescriptionMayModal
        isOpen={isShortDesMayModalOpen}
        onClose={() => setIsShortDesMayModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveShortDescriptionMay}
      />
      <ShortDescriptionModal
        isOpen={isShortDescModalOpen}
        onClose={() => setIsShortDescModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveShortDescription}
      />
      <OtherDescriptionMinModal
        isOpen={isOtherDescMinModalOpen}
        onClose={() => setIsOtherDescMinModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveOtherDescriptionMin}
      />
      <OtherDescriptionMayModal
        isOpen={isOtherDescMayModalOpen}
        onClose={() => setIsOtherDescMayModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveOtherDescriptionMay}
      />
      <SalesChannelsModal
        isOpen={isSalesChannelsModalOpen}
        onClose={() => setIsSalesChannelsModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveSalesChannels}
      />
      <AssignTagsModal
        isOpen={isAssignTagsOpen}
        onClose={() => setIsAssignTagsOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveTags}
      />
      <AssignBrandsModal
        isOpen={isAssignBrandsOpen}
        onClose={() => setIsAssignBrandsOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveBrands}
      />
    </div>
  );
};

export default PromotionalTextPage;
