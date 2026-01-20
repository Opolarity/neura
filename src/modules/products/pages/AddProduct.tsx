import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Upload, Save, ArrowLeft, ChevronDown } from 'lucide-react';
import WysiwygEditor from '@/components/ui/wysiwyg-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useAddProduct } from '../hooks/useAddProduct';

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
    loading,
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
    handleSubmit,
    navigate,
  } = useAddProduct();

  return (
    <div className="space-y-6">
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
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategorySelection(category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
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
      <Card>
        <CardHeader>
          <CardTitle>{isVariable ? 'Detalles de variaciones' : 'Detalles del producto'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Attributes Section (only for variable products) */}
          {isVariable && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Atributos del producto</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {termGroups.map(group => {
                  const groupTerms = terms.filter(term => term.term_group_id === group.id);
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
                      
                      {selectedGroupTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedGroupTerms.map(termId => {
                            const term = terms.find(t => t.id === termId);
                            return term ? (
                              <Badge
                                key={termId}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => toggleTermSelection(group.id, termId)}
                              >
                                {term.name}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
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
                                    value={price?.price ?? ''}
                                    onChange={(e) => updateVariationPrice(variation.id, pl.id, 'price', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    placeholder="0.00"
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
                            const stock = variation.stock.find(s => s.warehouse_id === wh.id);
                            return (
                              <TableCell key={wh.id} className="p-2">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={stock?.stock ?? ''}
                                  onChange={(e) => updateVariationStock(variation.id, wh.id, e.target.value)}
                                  className="h-8 text-sm text-center"
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
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <p>No hay imágenes subidas. Suba imágenes en la galería general primero.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px] sticky left-0 bg-background">Variación</TableHead>
                          <TableHead>Imágenes (seleccionar de la galería)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variations.map(variation => (
                          <TableRow key={variation.id}>
                            <TableCell className="font-medium sticky left-0 bg-background align-top pt-4">
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
                                {productImages.map(image => (
                                  <div
                                    key={image.id}
                                    className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                                      variation.selectedImages.includes(image.id)
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-border hover:border-muted-foreground'
                                    }`}
                                    onClick={() => toggleVariationImage(variation.id, image.id)}
                                  >
                                    <img
                                      src={image.preview}
                                      alt="Product"
                                      className="w-16 h-16 object-cover"
                                    />
                                    {variation.selectedImages.includes(image.id) && (
                                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
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
