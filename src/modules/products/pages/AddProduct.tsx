import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Upload, Save, ArrowLeft, ChevronDown } from 'lucide-react';
import WysiwygEditor from '@/components/ui/wysiwyg-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useAddProduct } from '../hooks/useAddProduct';
import { PageLoader } from '@/shared/components/page-loader';
import { buildCategoryTree, flattenCategoryTree } from '../utils/categoryTree';

const AddProduct = () => {
  const {
    isEditMode,
    productName,
    setProductName,
    shortDescription,
    setShortDescription,
    description,
    setDescription,
    selectedCategories,
    isVariable,
    isActive,
    isWeb,
    setIsVariable,
    setIsActive,
    setIsWeb,
    productImages,
    variations,
    variationSkus,
    selectedTermGroups,
    setSelectedTermGroups,
    selectedTerms,
    categories,
    termGroups,
    terms,
    priceLists,
    warehouses,
    stockTypes,
    selectedStockType,
    setSelectedStockType,
    loading,
    isLoadingProduct,
    showResetVariationsDialog,
    confirmResetVariations,
    cancelResetVariations,
    handleImageUpload,
    removeImage,
    handleDragStart,
    handleDragOver,
    handleDrop,
    toggleCategorySelection,
    toggleTermSelection,
    updateVariationPrice,
    updateVariationStock,
    toggleVariationImage,
    getVariationLabel,
    getStockForType,
    handleSubmit,
    navigate,
  } = useAddProduct();

  // Procesar categorías en estructura jerárquica
  const hierarchicalCategories = useMemo(() => {
    const tree = buildCategoryTree(categories);
    return flattenCategoryTree(tree);
  }, [categories]);

  return (
    <div className="relative space-y-6 min-w-0 overflow-hidden">
      {isLoadingProduct && <PageLoader message="Cargando datos del producto..." />}
      {/* Reset Variations Confirmation Dialog */}
      <AlertDialog open={showResetVariationsDialog} onOpenChange={(open) => !open && cancelResetVariations()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear variaciones</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Está a punto de modificar los atributos del producto. Esto reseteará todas las variaciones
                existentes y creará nuevas combinaciones con los campos vacíos.
              </p>
              <p>
                Las variaciones anteriores serán desactivadas (no se eliminarán si tienen pedidos asociados).
              </p>
              <p className="font-medium">
                ¿Desea continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelResetVariations}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetVariations}>
              Sí, resetear variaciones
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Editar Producto' : 'Añadir Producto'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Actualizar la información del producto' : 'Crear un nuevo producto en el catálogo'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/products')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Guardar Producto')}
          </Button>
        </div>
      </div>

      {/* Main Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column - 8 columns */}
        <div className="lg:col-span-8 space-y-6">

          {/* General Data Card */}
          <Card>
            <CardHeader>
              <CardTitle>Datos generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">Nombre del producto *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ingrese el nombre del producto"
                />
              </div>

              <WysiwygEditor
                label="Descripción corta"
                value={shortDescription}
                onChange={setShortDescription}
                placeholder="Descripción breve del producto"
                height="120px"
                toolbar="basic"
              />

              <WysiwygEditor
                label="Descripción"
                value={description}
                onChange={setDescription}
                placeholder="Descripción detallada del producto"
                height="200px"
                toolbar="full"
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVariable"
                  checked={isVariable}
                  onCheckedChange={setIsVariable}
                />
                <Label htmlFor="isVariable">¿Es un producto variable?</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 4 columns */}
        <div className="lg:col-span-4 space-y-6">

          {/* Sales Channels Card */}
          <Card>
            <CardHeader>
              <CardTitle>Canales de venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="cursor-pointer">Activo (Tienda física)</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isWeb" className="cursor-pointer">Web (E-commerce)</Label>
                <Switch
                  id="isWeb"
                  checked={isWeb}
                  onCheckedChange={setIsWeb}
                />
              </div>
            </CardContent>
          </Card>

          {/* General Gallery Card */}
          <Card>
            <CardHeader>
              <CardTitle>Galería general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('images')?.click()}
                  className="w-full"
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Subiendo...' : 'Seleccionar imágenes'}
                </Button>
              </div>

              {productImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {productImages
                    .sort((a, b) => a.order - b.order)
                    .map(image => (
                      <div
                        key={image.id}
                        className="relative aspect-square group cursor-move select-none"
                        draggable
                        onDragStart={(e) => handleDragStart(e, image.id)}
                        onDragOver={(e) => handleDragOver(e, image.id)}
                        onDragEnd={handleDrop}
                      >
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg border pointer-events-none"
                          draggable={false}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none">
                          {image.order + 1}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {productImages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay imágenes. Arrastre para reordenar.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categories Card */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {hierarchicalCategories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                    style={{ paddingLeft: `${category.level * 16}px` }}
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategorySelection(category.id)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer flex items-center gap-1"
                    >
                      {category.level > 0 && (
                        <span className="text-muted-foreground text-xs">└</span>
                      )}
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variation Details Card - Full Width */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{isVariable ? 'Detalles de variaciones' : 'Detalles del producto'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 min-w-0">

          {/* Attributes Section (only for variable products) */}
          {isVariable && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Atributos del producto</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {termGroups.filter(g => g.is_active !== false).map(group => {
                  const groupTerms = terms.filter(term => term.term_group_id === group.id && term.is_active !== false);
                  const selectedGroupTerms = selectedTerms[group.id] || [];

                  return (
                    <div key={group.id} className="space-y-2">
                      <Label className="text-sm font-medium">{group.name}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedGroupTerms.length > 0
                              ? `${selectedGroupTerms.length} seleccionado${selectedGroupTerms.length > 1 ? 's' : ''}`
                              : `Seleccionar ${group.name.toLowerCase()}`
                            }
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {groupTerms.map(term => (
                                <CommandItem
                                  key={term.id}
                                  onSelect={() => {
                                    toggleTermSelection(group.id, term.id);
                                    if (!selectedTermGroups.includes(group.id)) {
                                      setSelectedTermGroups(prev => [...prev, group.id]);
                                    }
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedGroupTerms.includes(term.id)}
                                    className="mr-2"
                                  />
                                  {term.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs for Prices, Inventory, Images */}
          {variations.length > 0 && (
            <Tabs defaultValue="prices" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prices">Precios</TabsTrigger>
                <TabsTrigger value="inventory">Inventario</TabsTrigger>
                <TabsTrigger value="images">Imágenes</TabsTrigger>
              </TabsList>

              {/* Prices Tab */}
              <TabsContent value="prices" className="mt-4">
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px] sticky left-0 bg-background">Variación</TableHead>
                        {priceLists.map(pl => (
                          <TableHead key={pl.id} colSpan={2} className="text-center min-w-[200px]">
                            {pl.name}
                            <div className="text-xs font-normal text-muted-foreground mt-1">
                              <span className="inline-block w-1/2">Precio</span>
                              <span className="inline-block w-1/2">Oferta</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variations.map(variation => (
                        <TableRow key={variation.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">
                            <div className="flex flex-col">
                              <span>{getVariationLabel(variation)}</span>
                              {variationSkus[variation.id] && (
                                <span className="text-xs text-muted-foreground">
                                  SKU: {variationSkus[variation.id]}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {priceLists.map(pl => {
                            const price = variation.prices.find(p => p.price_list_id === pl.id);
                            return (
                              <React.Fragment key={pl.id}>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={price?.price || 0}
                                    onChange={(e) => updateVariationPrice(variation.id, pl.id, 'price', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={price?.sale_price ?? ''}
                                    onChange={(e) => updateVariationPrice(variation.id, pl.id, 'sale_price', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-4">
                {/* Stock Type Filter */}
                <div className="mb-4 flex items-center gap-3">
                  <Label className="text-sm font-medium">Tipo de Inventario:</Label>
                  <Select
                    value={selectedStockType?.toString() || ''}
                    onValueChange={(value) => setSelectedStockType(Number(value))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px] sticky left-0 bg-background">Variación</TableHead>
                        {warehouses.map(wh => (
                          <TableHead key={wh.id} className="text-center min-w-[120px]">
                            {wh.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variations.map(variation => (
                        <TableRow key={variation.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">
                            <div className="flex flex-col">
                              <span>{getVariationLabel(variation)}</span>
                              {variationSkus[variation.id] && (
                                <span className="text-xs text-muted-foreground">
                                  SKU: {variationSkus[variation.id]}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {warehouses.map(wh => {
                            const stockValue = getStockForType(variation, wh.id, selectedStockType);
                            return (
                              <TableCell key={wh.id} className="p-2">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={stockValue ?? ''}
                                  onChange={(e) => updateVariationStock(variation.id, wh.id, e.target.value, selectedStockType || undefined)}
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-4">
                {productImages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay imágenes disponibles. Agregue imágenes en la sección "Galería general".
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] sticky left-0 bg-background">Variación</TableHead>
                          <TableHead>Imágenes disponibles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variations.map(variation => (
                          <TableRow key={variation.id}>
                            <TableCell className="font-medium sticky left-0 bg-background">
                              <div className="flex flex-col">
                                <span>{getVariationLabel(variation)}</span>
                                {variationSkus[variation.id] && (
                                  <span className="text-xs text-muted-foreground">
                                    SKU: {variationSkus[variation.id]}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {productImages
                                  .sort((a, b) => a.order - b.order)
                                  .map(image => {
                                    const isSelected = variation.selectedImages.includes(image.id);
                                    return (
                                      <div
                                        key={image.id}
                                        className={`relative w-16 h-16 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                                          }`}
                                        onClick={() => toggleVariationImage(variation.id, image.id)}
                                      >
                                        <img
                                          src={image.preview}
                                          alt="Product"
                                          className="w-full h-full object-cover"
                                        />
                                        {isSelected && (
                                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                              <span className="text-primary-foreground text-xs">✓</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
