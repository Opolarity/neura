import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

export const useAddProductLogic = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;
  
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isWeb, setIsWeb] = useState(false);
  const [originalIsVariable, setOriginalIsVariable] = useState(false);
  
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationSkus, setVariationSkus] = useState<Record<string, string>>({});
  const [selectedTermGroups, setSelectedTermGroups] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<{ [termGroupId: number]: number[] }>({});
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [termGroups, setTermGroups] = useState<TermGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isEditMode && productId && initialDataLoaded) {
      loadProductData(Number(productId));
    }
  }, [productId, isEditMode, initialDataLoaded]);

  useEffect(() => {
    if (isLoadingProduct) return;
    
    const groupsWithTerms = Object.keys(selectedTerms)
      .map(Number)
      .filter(groupId => selectedTerms[groupId]?.length > 0);
    
    if (JSON.stringify(groupsWithTerms.sort()) !== JSON.stringify(selectedTermGroups.sort())) {
      setSelectedTermGroups(groupsWithTerms);
    }

    if (isVariable && groupsWithTerms.length > 0) {
      generateVariations();
    } else if (!isVariable) {
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
      const { data, error } = await supabase.functions.invoke('get-product-form-data');

      if (error) throw error;

      setCategories(data.categories || []);
      setTermGroups(data.termGroups || []);
      setTerms(data.terms || []);
      setPriceLists(data.priceLists || []);
      setWarehouses(data.warehouses?.map((w: any) => ({ id: w.id, name: String(w.name) })) || []);
      
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

      const { data, error } = await supabase.functions.invoke('get-product-details', {
        body: { productId: id }
      });

      if (error) throw error;

      setProductName(data.product.title);
      setShortDescription(data.product.short_description || '');
      setDescription(data.product.description || '');
      setIsVariable(data.product.is_variable);
      setIsActive(data.product.active);
      setIsWeb(data.product.web);
      setOriginalIsVariable(data.product.is_variable);

      if (data.categories) {
        setSelectedCategories(data.categories);
      }

      if (data.images && data.images.length > 0) {
        const loadedImages: ProductImage[] = data.images.map((img: any, index: number) => {
          const storagePath = img.image_url.includes('products/')
            ? img.image_url.split('products/')[1].split('?')[0]
            : img.image_url;
            
          return {
            file: new File([], 'existing'),
            preview: img.image_url,
            id: `existing-${img.id}`,
            order: img.image_order || index
          };
        });
        setProductImages(loadedImages);
      }

      if (data.variations && data.variations.length > 0) {
        const skuMap: Record<string, string> = {};
        const collectedTerms: { [termGroupId: number]: number[] } = {};

        const loadedVariations: ProductVariation[] = data.variations.map((variation: any) => {
          if (variation.sku) {
            skuMap[`db-${variation.id}`] = variation.sku;
          }

          const attributes = variation.terms?.map((termId: number) => {
            const term = terms.find(t => t.id === termId);
            return {
              term_group_id: term?.term_group_id || 0,
              term_id: termId
            };
          }) || [];

          if (data.product.is_variable && variation.terms) {
            variation.terms.forEach((termId: number) => {
              const term = terms.find(t => t.id === termId);
              if (term) {
                if (!collectedTerms[term.term_group_id]) {
                  collectedTerms[term.term_group_id] = [];
                }
                if (!collectedTerms[term.term_group_id].includes(termId)) {
                  collectedTerms[term.term_group_id].push(termId);
                }
              }
            });
          }

          const prices: VariationPrice[] = variation.prices?.map((p: any) => ({
            price_list_id: p.price_list_id,
            price: Number(p.price),
            sale_price: p.sale_price
          })) || [];

          const stock: VariationStock[] = variation.stock?.map((s: any) => ({
            warehouse_id: s.warehouse_id,
            stock: Number(s.stock)
          })) || [];

          const selectedImages = variation.images?.map((imgId: number) => `existing-${imgId}`) || [];

          return {
            id: `db-${variation.id}`,
            attributes,
            prices,
            stock,
            selectedImages
          };
        });

        setVariationSkus(skuMap);
        setVariations(loadedVariations);
        
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
        
        const storagePath = await uploadImageToStorage(file, productId ? Number(productId) : undefined);
        
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(storagePath);
        
        newImages.push({
          file,
          preview: publicUrl,
          id: storagePath,
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
    
    if (imageToRemove && !imageId.startsWith('existing-')) {
      try {
        await supabase.storage
          .from('products')
          .remove([imageId]);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    setProductImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
        .map((img, index) => ({ ...img, order: index }));
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

  const updateVariationPrice = (variationId: string, priceListId: number, field: 'price' | 'sale_price', value: number | null) => {
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
      const { data, error } = await supabase.functions.invoke('validate-product-type-change', {
        body: { 
          productId: Number(productId),
          newIsVariable: isVariable
        }
      });

      if (error) throw error;

      if (!data.canChange) {
        toast({
          title: "No se puede cambiar el tipo",
          description: data.reason || "No puedes cambiar el tipo de producto",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating variable type change:', error);
      return false;
    }
  };

  const createProduct = async () => {
    const sortedImages = [...productImages].sort((a, b) => a.order - b.order);
    
    const imageRefs = sortedImages.map(image => ({
      id: image.id,
      path: image.id,
      order: image.order
    }));

    const productData = {
      productName,
      shortDescription,
      description,
      isVariable,
      isActive,
      isWeb,
      selectedCategories,
      productImages: imageRefs,
      variations
    };

    const { data, error } = await supabase.functions.invoke('create-product', {
      body: productData
    });

    if (error) {
      console.error('Edge function error:', error);
      // Try to extract server error message
      const serverBody = (error as any)?.context?.body;
      let errorMessage = error.message || 'Error al crear el producto';
      try {
        const parsed = typeof serverBody === 'string' ? JSON.parse(serverBody) : serverBody;
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
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
        isActive,
        isWeb,
        originalIsVariable,
        selectedCategories,
        productImages: imageRefs,
        variations
      }
    });

    if (error) {
      console.error('Error updating product:', error);
      // Try to extract server error message
      const serverBody = (error as any)?.context?.body;
      let errorMessage = error.message || "Error al actualizar el producto";
      try {
        const parsed = typeof serverBody === 'string' ? JSON.parse(serverBody) : serverBody;
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {}
      
      toast({
        title: "Error",
        description: errorMessage,
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

  return {
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
  };
};
