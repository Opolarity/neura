import { useState } from "react";
import { Input } from "@/components/ui/input";
import ProductsTable from "@/modules/products/components/products/ProductsTable";
import ProductsFilterModal from "@/modules/products/components/products/ProductsFilterModal";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import ProductsFilterBar from "@/modules/products/components/products/ProductsFilterBar";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { updatePromotionalTextApi } from "@/modules/products/services/products.service";
import { useToast } from "@/hooks/use-toast";
import LoadingDropdownMenu from "@/shared/components/LoadingDropdownMenu";
import { useEcommerceSso } from "../hooks/useEcommerceSso";
import { ExternalLink } from "lucide-react";

const PromotionalTextPage = () => {
  const {
      redirectToEcommerceMIN,
      redirectToEcommerceMAY,
      loadingMIN,
      loadingMAY,
    } = useEcommerceSso();
  // Texto y colores del banner se reflejan en el preview y se guardan en Supabase
  const [promoText, setPromoText] = useState("Texto promocional");
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  // Bloquea el botón mientras se espera respuesta de Supabase
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // Hook con toda la lógica de la tabla: carga, búsqueda, selección y paginación
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

  // Guarda el texto promocional en todos los productos tildados de la tabla
  const handleSave = async () => {
    if (selectedProducts.length === 0) { //validacion
      toast({
        title: "Sin productos seleccionados",
        description: "Selecciona al menos un producto en la tabla para aplicar el texto promocional.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true); //bloque el boton
    try {
      await updatePromotionalTextApi(selectedProducts, promoText, bgColor, textColor); // Llammada a supabase
      toast({
        title: "Guardado exitoso",
        description: `Texto promocional aplicado a ${selectedProducts.length} producto${selectedProducts.length > 1 ? "s" : ""}.`,
      });
    } catch (error) { //Resultado
      toast({
        title: "Error al guardar",
        description: "Ocurrió un error al aplicar el texto promocional. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return ( //Todo lo q vemos en la pantalla
    <div className="space-y-6">
      <div className="flex justify-between items-center">
<h1 className="text-2xl font-bold text-foreground">
        Edicion Texto Promocional
      </h1>

      <div>
        <LoadingDropdownMenu
            loading={loadingMIN || loadingMAY}
            label="Editar Ecommerce"
            icon={<ExternalLink className="w-4 h-4" />}
            options={[
              { label: "Minorista", onClick: redirectToEcommerceMIN },
              { label: "Mayorista", onClick: redirectToEcommerceMAY },
            ]}
          />
      </div>
      </div>
      

      {/* Editor: input de texto + selectores de color + preview en vivo + botón guardar */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium">Texto promocional</p>

          <div className="flex items-center gap-3">
            {/* Cada tecla actualiza promoText y el preview cambia al instante */}
            <Input
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="TEXTO PROMOCIONAL"
            />
            <label className="flex items-center gap-1 text-sm">
              Fondo
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 cursor-pointer rounded border"
              />
            </label>
            <label className="flex items-center gap-1 text-sm">
              Texto
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 cursor-pointer rounded border"
              />
            </label>
          </div>

          {/* Preview en vivo — bgColor y textColor se aplican como estilos inline */}
          <div
            className="w-full py-3 text-center rounded text-sm font-medium"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {promoText}
          </div>

          {/* Botón muestra cuántos productos están tildados: "Guardar (3)" */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSave}//ejecuta y llama a supabase y muestra el msj
              disabled={isSaving}//bloquea el boton
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {isSaving ?  "Guardando..." : `Guardar${selectedProducts.length > 0 ? ` (${selectedProducts.length})` : ""}`}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla con búsqueda, filtros y paginación — sin columnas Stock, Estado ni Acciones */}
      <Card>
        {/* Barra superior: buscador + botón de filtros + selector de orden */}
        <CardHeader>
          <ProductsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>  
        {/* Filas de productos con checkboxes para seleccionar */}
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

        {/* Navegación entre páginas y selector de filas por página */}
        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      {/* Modal de filtros — visible solo cuando isOpenFilterModal es true */}
      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        categories={categories}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default PromotionalTextPage;
