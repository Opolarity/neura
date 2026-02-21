import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AddProductService } from '../services/AddProduct.service';
import { AddProductAdapter } from '../adapters/AddProduct.adapter';
import type { 
  ProductImage, 
  ProductVariation, 
  AddProductState 
} from '../types/AddProduct.types';
import type { Category, TermGroup, Term, PriceList, Warehouse, VariationPrice, VariationStock, StockType, Channel } from '@/types';

export const useAddProduct = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;
  
  // Form state
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isWeb, setIsWeb] = useState(false);
  const [originalIsVariable, setOriginalIsVariable] = useState(false);
  
  // Images state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Variations state
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationSkus, setVariationSkus] = useState<Record<string, string>>({});
  const [selectedTermGroups, setSelectedTermGroups] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Record<number, number[]>>({});
  
  // Original terms for tracking changes in edit mode
  const [originalSelectedTerms, setOriginalSelectedTerms] = useState<Record<number, number[]>>({});
  const [attributesHaveChanged, setAttributesHaveChanged] = useState(false);
  
  // Reset variations dialog state
  const [showResetVariationsDialog, setShowResetVariationsDialog] = useState(false);
  const [pendingTermChange, setPendingTermChange] = useState<{ groupId: number; termId: number } | null>(null);
  
  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [termGroups, setTermGroups] = useState<TermGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockTypes, setStockTypes] = useState<StockType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [selectedStockType, setSelectedStockType] = useState<number | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productDataLoaded, setProductDataLoaded] = useState(false);

  // ================= Data Loading =================

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
    
    // In edit mode, only regenerate if attributes have changed
    if (isEditMode && productDataLoaded && !attributesHaveChanged) return;
    
    const groupsWithTerms = Object.keys(selectedTerms)
      .map(Number)
      .filter(groupId => selectedTerms[groupId]?.length > 0);
    
    if (JSON.stringify(groupsWithTerms.sort()) !== JSON.stringify(selectedTermGroups.sort())) {
      setSelectedTermGroups(groupsWithTerms);
    }

    if (isVariable && groupsWithTerms.length > 0) {
      generateVariations();
    } else if (!isVariable && priceLists.length > 0 && warehouses.length > 0) {
      const singleVariation: ProductVariation = {
        id: 'single',
        attributes: [],
        prices: priceLists.map(pl => ({ price_list_id: pl.id, price: 0, sale_price: undefined })),
        stock: warehouses.map(w => ({ warehouse_id: w.id, stock: undefined, hadInitialValue: false })),
        selectedImages: []
      };
      setVariations([singleVariation]);
    }
  }, [isVariable, selectedTerms, priceLists, warehouses, isEditMode, productDataLoaded, attributesHaveChanged]);

  const loadInitialData = async () => {
    try {
      const data = await AddProductService.getFormData();
      const adapted = AddProductAdapter.adaptFormData(data);
      
      setCategories(adapted.categories);
      setTermGroups(adapted.termGroups);
      setTerms(adapted.terms);
      setPriceLists(adapted.priceLists);
      setWarehouses(adapted.warehouses);
      setStockTypes(adapted.stockTypes);
      setChannels(adapted.channels as Channel[]);
      
      // Set default stock type to PRD (Production)
      const defaultType = adapted.stockTypes.find(t => t.code === 'PRD');
      if (defaultType) {
        setSelectedStockType(defaultType.id);
      } else if (adapted.stockTypes.length > 0) {
        setSelectedStockType(adapted.stockTypes[0].id);
      }
      
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

      const data = await AddProductService.getProductDetails(id);
      const adapted = AddProductAdapter.adaptProductDetails(data, terms, priceLists, warehouses);

      setProductName(adapted.product.title);
      setShortDescription(adapted.product.shortDescription);
      setDescription(adapted.product.description);
      setIsVariable(adapted.product.isVariable);
      setIsActive(adapted.product.isActive);
      setIsWeb(adapted.product.isWeb);
      setOriginalIsVariable(adapted.product.isVariable);
      setSelectedCategories(adapted.categories);
      setSelectedChannels(adapted.channels);
      setProductImages(adapted.images);
      setVariations(adapted.variations);
      setVariationSkus(adapted.variationSkus);
      
      if (Object.keys(adapted.selectedTerms).length > 0) {
        setSelectedTerms(adapted.selectedTerms);
        // Store a deep copy of original terms
        setOriginalSelectedTerms(JSON.parse(JSON.stringify(adapted.selectedTerms)));
      }

      setProductDataLoaded(true);

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
      setIsLoadingProduct(false);
    }
  };

  // ================= Variations =================

  const generateVariations = useCallback(() => {
    const selectedTermsByGroup = selectedTermGroups.map(groupId => ({
      groupId,
      terms: selectedTerms[groupId] || []
    }));

    const combinations = generateCombinations(selectedTermsByGroup);
    
    const newVariations: ProductVariation[] = combinations.map((combination, index) => ({
      id: `variation-${index}`,
      attributes: combination,
      prices: priceLists.map(pl => ({ price_list_id: pl.id, price: 0, sale_price: undefined })),
      stock: warehouses.map(w => ({ warehouse_id: w.id, stock: undefined, hadInitialValue: false })),
      selectedImages: []
    }));

    setVariations(newVariations);
    // Clear SKUs when regenerating
    setVariationSkus({});
  }, [selectedTermGroups, selectedTerms, priceLists, warehouses]);

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

  const getVariationLabel = useCallback((variation: ProductVariation) => {
    if (variation.attributes.length === 0) return 'Producto único';
    
    return variation.attributes.map(attr => {
      const term = terms.find(t => t.id === attr.term_id);
      return term?.name || '';
    }).join(' - ');
  }, [terms]);

  const getTermName = useCallback((termId: number) => {
    return terms.find(t => t.id === termId)?.name || '';
  }, [terms]);

  // ================= Image Handlers =================

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const currentMaxOrder = productImages.length > 0 ? Math.max(...productImages.map(img => img.order)) : -1;
      const newImages: ProductImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storagePath = await AddProductService.uploadImage(file, productId ? Number(productId) : undefined);
        const publicUrl = AddProductService.getPublicUrl(storagePath);
        
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
    if (!imageId.startsWith('existing-')) {
      try {
        await AddProductService.deleteImage(imageId);
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

  // ================= Category Handlers =================

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ================= Term Handlers =================

  const clearTermGroup = (termGroupId: number) => {
    setSelectedTerms(prevTerms => {
      const updatedTerms = { ...prevTerms };
      delete updatedTerms[termGroupId];
      return updatedTerms;
    });
  };

  // Check if a term change will affect existing variations
  const checkIfChangeAffectsVariations = (termGroupId: number, termId: number): boolean => {
    // If not in edit mode or no product loaded, no confirmation needed
    if (!isEditMode || !productDataLoaded) return false;
    
    // If product is not variable, no confirmation needed
    if (!isVariable) return false;
    
    // Check if there are existing variations with data
    if (variations.length === 0) return false;
    
    // Check if there's any variation with actual data (prices or stock)
    const hasDataInVariations = variations.some(v => 
      v.prices.some(p => p.price && p.price > 0) ||
      v.stock.some(s => s.stock && s.stock > 0)
    );
    
    if (!hasDataInVariations) return false;
    
    return true;
  };

  const applyTermChange = (termGroupId: number, termId: number) => {
    setSelectedTerms(prev => {
      const groupTerms = prev[termGroupId] || [];
      const updated = groupTerms.includes(termId)
        ? groupTerms.filter(id => id !== termId)
        : [...groupTerms, termId];
      
      return { ...prev, [termGroupId]: updated };
    });
  };

  const toggleTermSelection = (termGroupId: number, termId: number) => {
    // If in edit mode and product data is loaded, check if we need confirmation
    if (isEditMode && productDataLoaded && isVariable) {
      const wouldAffect = checkIfChangeAffectsVariations(termGroupId, termId);
      
      if (wouldAffect) {
        setPendingTermChange({ groupId: termGroupId, termId });
        setShowResetVariationsDialog(true);
        return;
      }
    }
    
    // No confirmation needed, apply change directly
    applyTermChange(termGroupId, termId);
    
    // Mark that attributes have changed
    if (isEditMode && productDataLoaded) {
      setAttributesHaveChanged(true);
    }
  };

  const confirmResetVariations = () => {
    if (pendingTermChange) {
      applyTermChange(pendingTermChange.groupId, pendingTermChange.termId);
      setAttributesHaveChanged(true);
      setPendingTermChange(null);
    }
    setShowResetVariationsDialog(false);
  };

  const cancelResetVariations = () => {
    setPendingTermChange(null);
    setShowResetVariationsDialog(false);
  };

  // ================= Variation Update Handlers =================

  const updateVariationPrice = (variationId: string, priceListId: number, field: 'price' | 'sale_price', value: string) => {
    setVariations(prev => prev.map(variation => {
      if (variation.id === variationId) {
        return {
          ...variation,
          prices: variation.prices.map(price => 
            price.price_list_id === priceListId
              ? { 
                  ...price, 
                  [field]: value === '' 
                    ? (field === 'sale_price' ? null : 0) 
                    : (isNaN(parseFloat(value)) ? (field === 'sale_price' ? null : 0) : parseFloat(value))
                }
              : price
          )
        };
      }
      return variation;
    }));
  };

  const updateVariationStock = (variationId: string, warehouseId: number, value: string, stockTypeId?: number) => {
    const typeId = stockTypeId || selectedStockType;
    
    setVariations(prev => prev.map(variation => {
      if (variation.id === variationId) {
        // Find existing stock entry for this warehouse and type
        const existingIndex = variation.stock.findIndex(
          s => s.warehouse_id === warehouseId && (s.stock_type_id === typeId || (!s.stock_type_id && !stockTypeId))
        );
        
        const newStockEntry: VariationStock = {
          warehouse_id: warehouseId,
          stock: value === '' ? undefined : Number(value),
          stock_type_id: typeId || undefined,
          hadInitialValue: existingIndex >= 0 ? variation.stock[existingIndex].hadInitialValue || value !== '' : value !== ''
        };
        
        let newStock: VariationStock[];
        if (existingIndex >= 0) {
          // Update existing entry
          newStock = [...variation.stock];
          newStock[existingIndex] = newStockEntry;
        } else {
          // Add new entry
          newStock = [...variation.stock, newStockEntry];
        }
        
        return { ...variation, stock: newStock };
      }
      return variation;
    }));
  };

  const getStockForType = (variation: ProductVariation, warehouseId: number, stockTypeId: number | null): number | undefined => {
    const stockEntry = variation.stock.find(
      s => s.warehouse_id === warehouseId && s.stock_type_id === stockTypeId
    );
    return stockEntry?.stock;
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

  // ================= Form Validation =================

  const validateForm = (): boolean => {
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

    // Las imágenes son opcionales - el backend usará placeholder si no hay ninguna

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

  // ================= Submit =================

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isEditMode && isVariable !== originalIsVariable) {
      const result = await AddProductService.validateTypeChange(Number(productId), isVariable);
      if (!result.canChange) {
        toast({
          title: "No se puede cambiar el tipo",
          description: result.reason || "No puedes cambiar el tipo de producto",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditMode) {
        const request = AddProductAdapter.prepareUpdateRequest(
          Number(productId),
          productName,
          shortDescription,
          description,
          isVariable,
          isActive,
          isWeb,
          originalIsVariable,
          selectedCategories,
          selectedChannels,
          productImages,
          variations,
          attributesHaveChanged
        );

        const result = await AddProductService.updateProduct(request);
        
        if (!result.success) {
          throw new Error(result.error || 'Error al actualizar el producto');
        }

        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente"
        });
      } else {
        const request = AddProductAdapter.prepareCreateRequest(
          productName,
          shortDescription,
          description,
          isVariable,
          isActive,
          isWeb,
          selectedCategories,
          selectedChannels,
          productImages,
          variations
        );

        const result = await AddProductService.createProduct(request);
        
        if (!result.success) {
          throw new Error(result.error || 'Error al crear el producto');
        }

        toast({
          title: "Éxito",
          description: result.message || "Producto creado correctamente"
        });
      }

      navigate('/products');
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

  return {
    // Mode
    isEditMode,
    
    // Form state
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
    
    // Images
    productImages,
    handleImageUpload,
    removeImage,
    handleDragStart,
    handleDragOver,
    handleDrop,
    
    // Variations
    variations,
    variationSkus,
    selectedTermGroups,
    setSelectedTermGroups,
    selectedTerms,
    
    // Reset variations dialog
    showResetVariationsDialog,
    confirmResetVariations,
    cancelResetVariations,
    
    // Reference data
    categories,
    termGroups,
    terms,
    priceLists,
    warehouses,
    stockTypes,
    channels,
    selectedChannels,
    setSelectedChannels,
    selectedStockType,
    setSelectedStockType,
    
    // Loading
    loading,
    isLoadingProduct,
    
    // Handlers
    toggleCategorySelection,
    toggleChannelSelection: (channelId: number) => {
      setSelectedChannels(prev => 
        prev.includes(channelId)
          ? prev.filter(id => id !== channelId)
          : [...prev, channelId]
      );
    },
    clearTermGroup,
    toggleTermSelection,
    updateVariationPrice,
    updateVariationStock,
    toggleVariationImage,
    getVariationLabel,
    getTermName,
    getStockForType,
    handleSubmit,
    navigate,
  };
};
