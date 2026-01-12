import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Save, ArrowLeft, ChevronDown } from 'lucide-react';
import WysiwygEditor from '@/components/ui/wysiwyg-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    clearTermGroup,
    toggleTermSelection,
    updateVariationPrice,
    updateVariationStock,
    toggleVariationImage,
    getVariationLabel,
    getTermName,
    handleSubmit,
    navigate,
  } = useAddProduct();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Editar Producto' : 'Añadir Producto'}
            </h1>
            <p className="text-gray-600">
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

      {/* Top Grid: General Data + Images + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos Generales - Takes 2 columns */}
        <Card className="lg:col-span-2">
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
              height="150px"
              toolbar="basic"
            />

            <WysiwygEditor
              label="Descripción"
              value={description}
              onChange={setDescription}
              placeholder="Descripción detallada del producto"
              height="250px"
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

        {/* Right Column */}
        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Ubicaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Activo</Label>
                <Switch
                id="isWeb"
                checked={isWeb}
                onCheckedChange={setIsWeb}
                />
                <Label htmlFor="isWeb">Web</Label>
              </div>
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Subir imágenes *</Label>
                <div className="mt-2">
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
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar imágenes
                  </Button>
                </div>
              </div>

              {productImages.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {productImages
                    .sort((a, b) => a.order - b.order)
                    .map(image => (
                    <div 
                      key={image.id} 
                      className="relative w-[150px] h-[150px] group cursor-move select-none"
                      draggable
                      onDragStart={(e) => handleDragStart(e, image.id)}
                      onDragOver={(e) => handleDragOver(e, image.id)}
                      onDragEnd={handleDrop}
                    >
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-[150px] h-[150px] object-cover rounded-lg border pointer-events-none"
                        draggable={false}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
            </CardContent>
          </Card>

          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Seleccionar categorías *</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategorySelection(category.id)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Variations or Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>{isVariable ? 'Variaciones' : 'Información adicional'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attributes Section (moved here) */}
          {isVariable && (
            <div>
              <Label>Atributos del producto</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                      
                      {/* Selected terms display */}
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

          {/* Variations List */}
          {variations.length > 0 && (
            <div className="space-y-6 mt-6">
              <div className="border-t pt-4">
                <h4 className="font-medium text-lg mb-4">
                  {isVariable ? 'Configurar variaciones' : 'Configurar producto'}
                </h4>
                <Accordion 
                  type="single" 
                  collapsible 
                  defaultValue={variations[0]?.id}
                  className="w-full space-y-4"
                >
                  {variations.map(variation => (
                    <AccordionItem 
                      key={variation.id} 
                      value={variation.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-lg">
                            {getVariationLabel(variation)}
                          </h4>
                          {variationSkus[variation.id] && (
                            <span className="text-sm text-muted-foreground">
                              SKU: {variationSkus[variation.id]}
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Prices */}
                        <div>
                          
                          <div className="space-y-3 mt-2">
                            {priceLists.map(priceList => {
                              const variationPrice = variation.prices.find(p => p.price_list_id === priceList.id);
                              return (
                                <div key={priceList.id} className="flex items-center gap-4">
                                  <Label className="text-sm font-medium w-[40%]">Precio {priceList.name}</Label>
                                  <div className="flex gap-2 w-[60%]">
                                    <Input
                                      type="number"
                                      placeholder="Precio"
                                      value={variationPrice?.price ?? ''}
                                      onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'price', e.target.value)}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Precio oferta"
                                      value={variationPrice?.sale_price ?? ''}
                                      onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'sale_price', e.target.value)}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stock */}
                        <div>
                          
                          <div className="space-y-3 mt-2">
                            {warehouses.map(warehouse => {
                              const variationStock = variation.stock.find(s => s.warehouse_id === warehouse.id);
                              return (
                                <div key={warehouse.id} className="flex items-center gap-4">
                                  <Label className="text-sm font-medium w-[40%]">Iventario {warehouse.name}</Label>
                                  <Input
                                    type="number"
                                    placeholder="Stock"
                                    value={variationStock?.stock || ''}
                                    onChange={(e) => updateVariationStock(variation.id, warehouse.id, Number(e.target.value))}
                                    className="w-[60%]"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Images (only for variable products) */}
                        {isVariable && productImages.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Imágenes de la variación</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {productImages.map(image => (
                                <div key={image.id} className="relative">
                                  <img
                                    src={image.preview}
                                    alt="Preview"
                                    className={`w-[100px] h-[100px] object-cover rounded border-2 cursor-pointer transition-all ${
                                      variation.selectedImages.includes(image.id)
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => toggleVariationImage(variation.id, image.id)}
                                  />
                                  {variation.selectedImages.includes(image.id) && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center pointer-events-none">
                                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AddProduct;