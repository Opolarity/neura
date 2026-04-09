import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProductsTable from "@/modules/products/components/products/ProductsTable";
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
} from "@/modules/products/services/products.service";
import PromotionalTextModal from "@/modules/ecommerce/components/PromotionalTextModal";
import SizeImagesModal from "@/modules/ecommerce/components/SizeImagesModal";
import ShortDescriptionModal from "@/modules/ecommerce/components/DescriptionModal";
import SalesChannelsModal from "@/modules/ecommerce/components/SalesChannelsModal";
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
  Ruler,
  Image,
  AlignLeft,
  AlignRight,
  Radio,
} from "lucide-react";
import ShortDescriptionMayModal from "../components/DescriptionMaYModal";
import PromotionalImageModal from "../components/PromotionalImage";

const PromotionalTextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSizeImagesModalOpen, setIsSizeImagesModalOpen] = useState(false);
  const [isShortDescModalOpen, setIsShortDescModalOpen] = useState(false);
  const [isShortDesMayModalOpen, setIsShortDesMayModalOpen] = useState(false);
  const [isPromotionalImageModal, setIsPromotionalImageModal] = useState(false);
  const [isSalesChannelsModalOpen, setIsSalesChannelsModalOpen] =
    useState(false);
  const { toast } = useToast();

  const {
    products,
    categories,
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
    });
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edición Masiva</h1>
          <p className="text-gray-600">Gestiona y actualiza los productos del ecommerce</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
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
                <Tag className="w-4 h-4 text-blue-500" />
                Texto Promocional
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setIsSizeImagesModalOpen(true)}
              >
                <Ruler className="w-4 h-4 text-purple-500" />
                Imágenes de Tallas
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setIsPromotionalImageModal(true)}
              >
                <Image className="w-4 h-4 text-orange-500" />
                Imágenes Promocionales
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setIsShortDesMayModalOpen(true)}
              >
                <AlignLeft className="w-4 h-4 text-green-600" />
                Descripción Mayorista
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setIsShortDescModalOpen(true)}
              >
                <AlignRight className="w-4 h-4 text-green-500" />
                Descripción Minorista
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setIsSalesChannelsModalOpen(true)}
              >
                <Radio className="w-4 h-4 text-red-500" />
                Canales de Venta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
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

        <CardContent className="p-0">
          <ProductsTable
            search={search}
            products={products}
            loading={loading}
            selectedProducts={selectedProducts}
            onToggleAllProductsSelection={toggleSelectAll}
            onToggleProductSelection={toggleProductSelection}
            hideStock
            hideStatus
            hideActions
          />
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        categories={categories}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
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
      <SalesChannelsModal
        isOpen={isSalesChannelsModalOpen}
        onClose={() => setIsSalesChannelsModalOpen(false)}
        selectedCount={selectedProducts.length}
        onSave={handleSaveSalesChannels}
      />
    </div>
  );
};

export default PromotionalTextPage;
