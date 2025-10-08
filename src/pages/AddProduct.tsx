import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { X, Upload, Save, ArrowLeft, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WysiwygEditor from '../components/ui/wysiwyg-editor';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '../components/ui/command';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import type { 
  Category, 
  TermGroup, 
  Term, 
  PriceList, 
  Warehouse, 
  VariationPrice, 
  VariationStock,
  ProductImage,
  ProductVariation
} from '@/types';

const AddProduct = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;
  
  // Basic product data
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const [originalIsVariable, setOriginalIsVariable] = useState(false);
  
  // Product images
const [productImages, setProductImages] = useState<ProductImage[]>([]);
const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Variations
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationSkus, setVariationSkus] = useState<Record<string, string>>({});
  const [selectedTermGroups, setSelectedTermGroups] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<{ [termGroupId: number]: number[] }>({});
  
  // Data from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [termGroups, setTermGroups] = useState<TermGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load product data if in edit mode - wait for initial data to be loaded
  useEffect(() => {
    if (isEditMode && productId && initialDataLoaded) {
      loadProductData(Number(productId));
    }
  }, [productId, isEditMode, initialDataLoaded]);

  // Generate variations when attributes change
  useEffect(() => {
    // Don't regenerate variations if we're loading a product from DB
    if (isLoadingProduct) return;
    
    // Auto-update selectedTermGroups based on selectedTerms
    const groupsWithTerms = Object.keys(selectedTerms)
      .map(Number)
      .filter(groupId => selectedTerms[groupId]?.length > 0);
    
    if (JSON.stringify(groupsWithTerms.sort()) !== JSON.stringify(selectedTermGroups.sort())) {
      setSelectedTermGroups(groupsWithTerms);
    }

    if (isVariable && groupsWithTerms.length > 0) {
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
  }, [isVariable, selectedTerms, priceLists, warehouses]);

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
      
      setInitialDataLoaded(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos iniciales",
        variant: "destructive"
      });
    }
  };

  const loadProductData = async (id: number) => {
    try {
      setLoading(true);
      setIsLoadingProduct(true);
      
      // Get product basic data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      setProductName(product.title);
      setShortDescription(product.short_description || '');
      setDescription(product.description || '');
      setIsVariable(product.is_variable);
      setOriginalIsVariable(product.is_variable);

      // Get categories
      const { data: productCategories } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', id);
      
      if (productCategories) {
        setSelectedCategories(productCategories.map(pc => pc.category_id));
      }

      // Get images
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('image_order');

      if (images && images.length > 0) {
        const loadedImages: ProductImage[] = images.map((img: any, index) => {
          // Extract storage path from URL if needed
          const storagePath = img.image_url.includes('products/') 
            ? img.image_url.split('products/')[1].split('?')[0]
            : img.image_url;
            
          return {
            file: new File([], 'existing'), // Dummy file for existing images
            preview: img.image_url,
            id: `existing-${img.id}`,
            order: img.image_order || index
          };
        });
        setProductImages(loadedImages);
      }

      // Get variations
      const { data: variationsData } = await supabase
        .from('variations')
        .select('id, sku')
        .eq('product_id', id) as any;

      if (variationsData && variationsData.length > 0) {
        // Store SKUs
        const skuMap: Record<string, string> = {};
        variationsData.forEach((variation: any) => {
          if (variation.sku) {
            skuMap[`db-${variation.id}`] = variation.sku;
          }
        });
        setVariationSkus(skuMap);

        // Collect all terms from all variations first
        const collectedTerms: { [termGroupId: number]: number[] } = {};
        
        const loadedVariations: ProductVariation[] = await Promise.all(
          variationsData.map(async (variation: any) => {
            // Get variation terms
            const { data: variationTerms } = await supabase
              .from('variation_terms')
              .select('term_id')
              .eq('product_variation_id', variation.id);

            const attributes = variationTerms?.map(vt => {
              const term = terms.find(t => t.id === vt.term_id);
              return {
                term_group_id: term?.term_group_id || 0,
                term_id: vt.term_id
              };
            }) || [];

            // Collect terms for variable products
            if (product.is_variable && variationTerms) {
              variationTerms.forEach(vt => {
                const term = terms.find(t => t.id === vt.term_id);
                if (term) {
                  if (!collectedTerms[term.term_group_id]) {
                    collectedTerms[term.term_group_id] = [];
                  }
                  if (!collectedTerms[term.term_group_id].includes(vt.term_id)) {
                    collectedTerms[term.term_group_id].push(vt.term_id);
                  }
                }
              });
            }

            // Get prices
            const { data: pricesData } = await supabase
              .from('product_price')
              .select('*')
              .eq('product_variation_id', variation.id);

            const prices: VariationPrice[] = pricesData?.map(p => ({
              price_list_id: p.proce_list_id,
              price: Number(p.price),
              sale_price: Number(p.sale_price || 0)
            })) || [];

            // Get stock
            const { data: stockData } = await supabase
              .from('product_stock')
              .select('*')
              .eq('product_variation_id', variation.id);

            const stock: VariationStock[] = stockData?.map(s => ({
              warehouse_id: s.warehouse_id,
              stock: Number(s.stock)
            })) || [];

            // Get variation images
            const { data: varImages } = await supabase
              .from('product_variation_images')
              .select('product_image_id')
              .eq('product_variation_id', variation.id);

            const selectedImages = varImages?.map(vi => `existing-${vi.product_image_id}`) || [];

            return {
              id: `db-${variation.id}`,
              attributes,
              prices,
              stock,
              selectedImages
            };
          })
        );

        setVariations(loadedVariations);
        
        // Set selectedTerms after all variations are loaded
        if (Object.keys(collectedTerms).length > 0) {
          setSelectedTerms(collectedTerms);
        }
      }

      toast({
        title: "Producto cargado",
        description: "Los datos del producto se han cargado correctamente"
      });

    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el producto",
        variant: "destructive"
      });
      navigate('/products');
    } finally {
      setLoading(false);
      // Delay clearing the flag to ensure variations are set
      setTimeout(() => {
        setIsLoadingProduct(false);
      }, 100);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const currentMaxOrder = productImages.length > 0 ? Math.max(...productImages.map(img => img.order)) : -1;
      const newImages: ProductImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = Date.now() + '-' + i;
        
        // Upload to storage immediately
        const storagePath = await uploadImageToStorage(file, productId ? Number(productId) : undefined);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(storagePath);
        
        newImages.push({
          file,
          preview: publicUrl,
          id: storagePath, // Use storage path as ID
          order: currentMaxOrder + i + 1
        });
      }

      setProductImages(prev => [...prev, ...newImages]);
      
      toast({
        title: "Imágenes subidas",
        description: `${newImages.length} imagen${newImages.length > 1 ? 'es' : ''} subida${newImages.length > 1 ? 's' : ''} correctamente`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Error al subir las imágenes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    const imageToRemove = productImages.find(img => img.id === imageId);
    
    // If it's a newly uploaded image (not existing), delete from storage
    if (imageToRemove && !imageId.startsWith('existing-')) {
      try {
        await supabase.storage
          .from('products')
          .remove([imageId]); // imageId is the storage path
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    setProductImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
        .map((img, index) => ({ ...img, order: index })); // Reorder after removal
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

const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', imageId);
  setDraggedId(imageId);
};

const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetImageId: string) => {
  e.preventDefault();
  if (!draggedId || draggedId === targetImageId) return;

  setProductImages(prev => {
    const draggedIndex = prev.findIndex(img => img.id === draggedId);
    const targetIndex = prev.findIndex(img => img.id === targetImageId);
    if (draggedIndex === -1 || targetIndex === -1) return prev;

    const newImages = [...prev];
    const [dragged] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, dragged);
    return newImages.map((img, index) => ({ ...img, order: index }));
  });
};

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setDraggedId(null);
};

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearTermGroup = (termGroupId: number) => {
    setSelectedTerms(prevTerms => {
      const updatedTerms = { ...prevTerms };
      delete updatedTerms[termGroupId];
      return updatedTerms;
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

    if (isVariable) {
      const groupsWithTerms = Object.keys(selectedTerms)
        .filter(groupId => selectedTerms[Number(groupId)]?.length > 0);
      
      if (groupsWithTerms.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos un atributo para productos variables",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const uploadImageToStorage = async (file: File, productId?: number): Promise<string> => {
    const tempId = productId || 'tmp';
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${tempId}/${crypto.randomUUID()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      throw uploadError;
    }

    return fileName;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check if is_variable changed and validate
    if (isEditMode && isVariable !== originalIsVariable) {
      const canChange = await validateVariableTypeChange();
      if (!canChange) return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updateProduct();
      } else {
        await createProduct();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateVariableTypeChange = async (): Promise<boolean> => {
    try {
      // Check if product has orders
      const { data: variationsData } = await supabase
        .from('variations')
        .select('id')
        .eq('product_id', Number(productId));

      if (variationsData && variationsData.length > 0) {
        const variationIds = variationsData.map(v => v.id);

        const { data: orderProducts } = await supabase
          .from('order_products')
          .select('id')
          .in('product_variation_id', variationIds)
          .limit(1);

        if (orderProducts && orderProducts.length > 0) {
          toast({
            title: "No se puede cambiar el tipo",
            description: "No puedes cambiar el tipo de producto porque tiene órdenes vinculadas",
            variant: "destructive"
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating variable type change:', error);
      return false;
    }
  };

  const createProduct = async () => {
    // Sort images by order
    const sortedImages = [...productImages].sort((a, b) => a.order - b.order);
    
    // Prepare images with path info
    const imageRefs = sortedImages.map(image => ({
      id: image.id,
      path: image.id, // The ID is now the storage path
      order: image.order
    }));

    // Prepare data for edge function
    const productData = {
      productName,
      shortDescription,
      description,
      isVariable,
      selectedCategories,
      productImages: imageRefs,
      variations
    };

    // Call edge function
    const { data, error } = await supabase.functions.invoke('create-product', {
      body: productData
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Error al crear el producto');
    }

    if (!data.success) {
      throw new Error(data.error || 'Error al crear el producto');
    }

    toast({
      title: "Éxito",
      description: data.message || "Producto creado correctamente"
    });

    navigate('/products');
  };

  const updateProduct = async () => {
    const id = Number(productId);

    // Prepare image references
    const imageRefs = productImages.map(img => ({
      id: img.id,
      path: img.id.startsWith('existing-') ? img.preview : img.id,
      order: img.order,
      isExisting: img.id.startsWith('existing-')
    }));

    const { data, error } = await supabase.functions.invoke('update-product', {
      body: {
        productId: id,
        productName,
        shortDescription,
        description,
        isVariable,
        originalIsVariable,
        selectedCategories,
        productImages: imageRefs,
        variations
      }
    });

    if (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el producto",
        variant: "destructive"
      });
      return;
    }

    if (!data.success) {
      toast({
        title: "Error",
        description: data.error || "Error al actualizar el producto",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Éxito",
      description: "Producto actualizado correctamente"
    });

    navigate('/products');
  };

  return (
    <div className="space-y-6">
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
                          <Label className="text-sm font-medium mb-3">Precios</Label>
                          <div className="space-y-3 mt-2">
                            {priceLists.map(priceList => {
                              const variationPrice = variation.prices.find(p => p.price_list_id === priceList.id);
                              return (
                                <div key={priceList.id} className="flex items-center gap-4">
                                  <Label className="text-sm font-medium w-[40%]">{priceList.name}</Label>
                                  <div className="flex gap-2 w-[60%]">
                                    <Input
                                      type="number"
                                      placeholder="Precio"
                                      value={variationPrice?.price || ''}
                                      onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'price', Number(e.target.value))}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Precio oferta"
                                      value={variationPrice?.sale_price || ''}
                                      onChange={(e) => updateVariationPrice(variation.id, priceList.id, 'sale_price', Number(e.target.value))}
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
                          <Label className="text-sm font-medium mb-3">Inventario</Label>
                          <div className="space-y-3 mt-2">
                            {warehouses.map(warehouse => {
                              const variationStock = variation.stock.find(s => s.warehouse_id === warehouse.id);
                              return (
                                <div key={warehouse.id} className="flex items-center gap-4">
                                  <Label className="text-sm font-medium w-[40%]">{warehouse.name}</Label>
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/products')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Guardar Producto')}
        </Button>
      </div>
    </div>
  );
};

export default AddProduct;