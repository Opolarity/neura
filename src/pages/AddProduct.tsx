import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { X, Upload, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import WysiwygEditor from '../components/ui/wysiwyg-editor';

interface Category {
  id: number;
  name: string;
}

interface TermGroup {
  id: number;
  name: string;
  code: string;
}

interface Term {
  id: number;
  name: string;
  term_group_id: number;
}

interface PriceList {
  id: number;
  name: string;
  code: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface ProductImage {
  file: File;
  preview: string;
  id: string;
}

interface VariationPrice {
  price_list_id: number;
  price: number;
  sale_price: number;
}

interface VariationStock {
  warehouse_id: number;
  stock: number;
}

interface ProductVariation {
  id: string;
  attributes: { term_group_id: number; term_id: number }[];
  prices: VariationPrice[];
  stock: VariationStock[];
  selectedImages: string[];
}

const AddProduct = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Basic product data
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  
  // Product images
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  
  // Variations
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedTermGroups, setSelectedTermGroups] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<{ [termGroupId: number]: number[] }>({});
  
  // Data from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [termGroups, setTermGroups] = useState<TermGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Generate variations when attributes change
  useEffect(() => {
    if (isVariable && selectedTermGroups.length > 0) {
      generateVariations();
    } else if (!isVariable) {
      // Create single variation for non-variable product
      const singleVariation: ProductVariation = {
        id: 'single',
        attributes: [],
        prices: priceLists.map(pl => ({ price_list_id: pl.id, price: 0, sale_price: 0 })),
        stock: warehouses.map(w => ({ warehouse_id: w.id, stock: 0 })),
        selectedImages: []
      };
      setVariations([singleVariation]);
    }
  }, [isVariable, selectedTermGroups, selectedTerms, priceLists, warehouses]);

  const loadInitialData = async () => {
    try {
      const [categoriesRes, termGroupsRes, termsRes, priceListsRes, warehousesRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('term_groups').select('*').order('name'),
        supabase.from('terms').select('*').order('name'),
        supabase.from('price_list').select('*').order('name'),
        supabase.from('warehouses').select('id, name').order('name')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (termGroupsRes.error) throw termGroupsRes.error;
      if (termsRes.error) throw termsRes.error;
      if (priceListsRes.error) throw priceListsRes.error;
      if (warehousesRes.error) throw warehousesRes.error;

      setCategories(categoriesRes.data || []);
      setTermGroups(termGroupsRes.data || []);
      setTerms(termsRes.data || []);
      setPriceLists(priceListsRes.data || []);
      setWarehouses(warehousesRes.data?.map(w => ({ id: w.id, name: String(w.name) })) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos iniciales",
        variant: "destructive"
      });
    }
  };

  const generateVariations = () => {
    const selectedTermsByGroup = selectedTermGroups.map(groupId => ({
      groupId,
      terms: selectedTerms[groupId] || []
    }));

    // Generate all combinations
    const combinations = generateCombinations(selectedTermsByGroup);
    
    const newVariations: ProductVariation[] = combinations.map((combination, index) => ({
      id: `variation-${index}`,
      attributes: combination,
      prices: priceLists.map(pl => ({ price_list_id: pl.id, price: 0, sale_price: 0 })),
      stock: warehouses.map(w => ({ warehouse_id: w.id, stock: 0 })),
      selectedImages: []
    }));

    setVariations(newVariations);
  };

  const generateCombinations = (termsByGroup: { groupId: number; terms: number[] }[]): { term_group_id: number; term_id: number }[][] => {
    if (termsByGroup.length === 0) return [];
    if (termsByGroup.length === 1) {
      return termsByGroup[0].terms.map(termId => [{ term_group_id: termsByGroup[0].groupId, term_id: termId }]);
    }

    const [first, ...rest] = termsByGroup;
    const restCombinations = generateCombinations(rest);
    
    const combinations: { term_group_id: number; term_id: number }[][] = [];
    
    for (const termId of first.terms) {
      for (const restCombination of restCombinations) {
        combinations.push([{ term_group_id: first.groupId, term_id: termId }, ...restCombination]);
      }
    }
    
    return combinations;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Date.now() + '-' + i;
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        id
      });
    }

    setProductImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId: string) => {
    setProductImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Remove from variations' selected images
      setVariations(prevVariations => 
        prevVariations.map(variation => ({
          ...variation,
          selectedImages: variation.selectedImages.filter(id => id !== imageId)
        }))
      );
      return updated;
    });
  };

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTermGroupSelection = (termGroupId: number) => {
    setSelectedTermGroups(prev => {
      const updated = prev.includes(termGroupId)
        ? prev.filter(id => id !== termGroupId)
        : [...prev, termGroupId];
      
      // Clear selected terms for removed groups
      if (!updated.includes(termGroupId)) {
        setSelectedTerms(prevTerms => {
          const updatedTerms = { ...prevTerms };
          delete updatedTerms[termGroupId];
          return updatedTerms;
        });
      }
      
      return updated;
    });
  };

  const toggleTermSelection = (termGroupId: number, termId: number) => {
    setSelectedTerms(prev => {
      const groupTerms = prev[termGroupId] || [];
      const updated = groupTerms.includes(termId)
        ? groupTerms.filter(id => id !== termId)
        : [...groupTerms, termId];
      
      return { ...prev, [termGroupId]: updated };
    });
  };

  const updateVariationPrice = (variationId: string, priceListId: number, field: 'price' | 'sale_price', value: number) => {
    setVariations(prev => prev.map(variation => {
      if (variation.id === variationId) {
        return {
          ...variation,
          prices: variation.prices.map(price => 
            price.price_list_id === priceListId
              ? { ...price, [field]: value }
              : price
          )
        };
      }
      return variation;
    }));
  };

  const updateVariationStock = (variationId: string, warehouseId: number, stock: number) => {
    setVariations(prev => prev.map(variation => {
      if (variation.id === variationId) {
        return {
          ...variation,
          stock: variation.stock.map(s => 
            s.warehouse_id === warehouseId
              ? { ...s, stock }
              : s
          )
        };
      }
      return variation;
    }));
  };

  const toggleVariationImage = (variationId: string, imageId: string) => {
    setVariations(prev => prev.map(variation => {
      if (variation.id === variationId) {
        const selectedImages = variation.selectedImages.includes(imageId)
          ? variation.selectedImages.filter(id => id !== imageId)
          : [...variation.selectedImages, imageId];
        return { ...variation, selectedImages };
      }
      return variation;
    }));
  };

  const getVariationLabel = (variation: ProductVariation) => {
    if (variation.attributes.length === 0) return 'Producto único';
    
    return variation.attributes.map(attr => {
      const term = terms.find(t => t.id === attr.term_id);
      return term?.name || '';
    }).join(' - ');
  };

  const getTermName = (termId: number) => {
    return terms.find(t => t.id === termId)?.name || '';
  };

  const validateForm = () => {
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una categoría",
        variant: "destructive"
      });
      return false;
    }

    if (productImages.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una imagen del producto",
        variant: "destructive"
      });
      return false;
    }

    if (isVariable && selectedTermGroups.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un grupo de atributos para productos variables",
        variant: "destructive"
      });
      return false;
    }

    if (isVariable && selectedTermGroups.some(groupId => !selectedTerms[groupId] || selectedTerms[groupId].length === 0)) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un atributo por cada grupo seleccionado",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: productName,
          short_description: shortDescription,
          description: description,
          is_variable: isVariable
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Create product categories (without id field)
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          product_id: product.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from('product_categories')
          .insert(categoryInserts.map((cat, index) => ({ ...cat, id: Date.now() + index })));

        if (categoriesError) throw categoriesError;
      }

      // 3. Upload images and create product_images records
      const imageUrls: { id: string; url: string }[] = [];
      
      for (const image of productImages) {
        const fileName = `${product.id}/${Date.now()}-${image.file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        const { data: imageRecord, error: imageError } = await supabase
          .from('product_images')
          .insert({
            id: Date.now() + Math.floor(Math.random() * 1000),
            product_id: product.id,
            image_url: publicUrl
          })
          .select()
          .single();

        if (imageError) throw imageError;

        if (imageRecord) {
          imageUrls.push({ id: image.id, url: publicUrl });
        }
      }

      // 4. Create variations
      for (const variation of variations) {
        // Create variation record
        const { data: variationRecord, error: variationError } = await supabase
          .from('variations')
          .insert({
            product_id: product.id
          })
          .select()
          .single();

        if (variationError) throw variationError;

        // Create variation terms (without id field)
        if (variation.attributes.length > 0) {
          const termInserts = variation.attributes.map(attr => ({
            product_variation_id: variationRecord.id,
            term_id: attr.term_id
          }));

          const { error: termsError } = await supabase
            .from('variation_terms')
            .insert(termInserts);

          if (termsError) throw termsError;
        }

        // Create prices (without id field, check typo proce_list_id -> price_list_id)
        const priceInserts = variation.prices.filter(p => p.price > 0 || p.sale_price > 0).map(price => ({
          product_variation_id: variationRecord.id,
          proce_list_id: price.price_list_id, // Note: keeping original typo from schema
          price: price.price,
          sale_price: price.sale_price
        }));

        if (priceInserts.length > 0) {
          const { error: pricesError } = await supabase
            .from('product_price')
            .insert(priceInserts);

          if (pricesError) throw pricesError;
        }

        // Create stock (without id field)
        const stockInserts = variation.stock.filter(s => s.stock > 0).map(stock => ({
          product_variation_id: variationRecord.id,
          warehouse_id: stock.warehouse_id,
          stock: stock.stock
        }));

        if (stockInserts.length > 0) {
          const { error: stockError } = await supabase
            .from('product_stock')
            .insert(stockInserts.map((stock, index) => ({ ...stock, id: Date.now() + index })));

          if (stockError) throw stockError;
        }

        // Create variation images (only for variable products, without id field)
        if (isVariable && variation.selectedImages.length > 0) {
          // Find corresponding image URLs
          for (const imageId of variation.selectedImages) {
            const imageUrl = imageUrls.find(img => img.id === imageId);
            if (imageUrl) {
              // Get the product_images.id for this URL
              const { data: productImageRecord } = await supabase
                .from('product_images')
                .select('id')
                .eq('image_url', imageUrl.url)
                .single();

              if (productImageRecord) {
                const { error: variationImageError } = await supabase
                  .from('product_variation_images')
                  .insert({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    product_variation_id: variationRecord.id,
                    product_image_id: productImageRecord.id
                  });

                if (variationImageError) throw variationImageError;
              }
            }
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Producto creado correctamente"
      });

      navigate('/products');

    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Error al crear el producto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Añadir Producto</h1>
          <p className="text-gray-600">Crear un nuevo producto en el catálogo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
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

            <div>
              <Label>Categorías *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
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

            <div className="flex items-center space-x-2">
              <Switch
                id="isVariable"
                checked={isVariable}
                onCheckedChange={setIsVariable}
              />
              <Label htmlFor="isVariable">¿Es producto variable?</Label>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {productImages.map(image => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variable Product Attributes */}
      {isVariable && (
        <Card>
          <CardHeader>
            <CardTitle>Atributos del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Grupos de atributos</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {termGroups.map(group => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={selectedTermGroups.includes(group.id)}
                        onCheckedChange={() => toggleTermGroupSelection(group.id)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="font-medium">
                        {group.name}
                      </Label>
                    </div>
                    
                    {selectedTermGroups.includes(group.id) && (
                      <div className="ml-6 space-y-1">
                        {terms.filter(term => term.term_group_id === group.id).map(term => (
                          <div key={term.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`term-${term.id}`}
                              checked={selectedTerms[group.id]?.includes(term.id) || false}
                              onCheckedChange={() => toggleTermSelection(group.id, term.id)}
                            />
                            <Label htmlFor={`term-${term.id}`} className="text-sm">
                              {term.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variaciones del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {variations.map(variation => (
                <div key={variation.id} className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-lg">
                    {getVariationLabel(variation)}
                  </h4>

                  {/* Prices */}
                  <div>
                    <Label className="text-sm font-medium">Precios</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {priceLists.map(priceList => {
                        const variationPrice = variation.prices.find(p => p.price_list_id === priceList.id);
                        return (
                          <div key={priceList.id} className="space-y-2">
                            <Label className="text-xs text-gray-600">{priceList.name}</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Precio"
                                  value={variationPrice?.price || ''}
                                  onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Precio oferta"
                                  value={variationPrice?.sale_price || ''}
                                  onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'sale_price', Number(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <Label className="text-sm font-medium">Inventario</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {warehouses.map(warehouse => {
                        const variationStock = variation.stock.find(s => s.warehouse_id === warehouse.id);
                        return (
                          <div key={warehouse.id} className="space-y-1">
                            <Label className="text-xs text-gray-600">{warehouse.name}</Label>
                            <Input
                              type="number"
                              placeholder="Stock"
                              value={variationStock?.stock || ''}
                              onChange={(e) => updateVariationStock(variation.id, warehouse.id, Number(e.target.value))}
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
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                        {productImages.map(image => (
                          <div key={image.id} className="relative">
                            <img
                              src={image.preview}
                              alt="Preview"
                              className={`w-full h-16 object-cover rounded border-2 cursor-pointer transition-all ${
                                variation.selectedImages.includes(image.id)
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleVariationImage(variation.id, image.id)}
                            />
                            {variation.selectedImages.includes(image.id) && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/products')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </div>
    </div>
  );
};

export default AddProduct;