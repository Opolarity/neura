import { useState, useEffect, useCallback } from 'react';
import { getTodayDate, getLimaDateTimeNow, limaDateTimeLocalToIso } from "@/shared/utils/date";
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddProductService } from '../services/AddProduct.service';
import { AddProductAdapter } from '../adapters/AddProduct.adapter';
import { createCategoryApi, categoriesListApi } from '../services/Categories.service';
import { createTag } from '../services/Tags.service';
import { createBrand } from '../services/Brands.service';
import { slugify } from '@/shared/utils/slug';
import type {
  ProductImage, 
  ProductVariation,
  AddProductState,
  ProductTag,
  ProductBrand
} from '../types/AddProduct.types';
import type { Category, TermGroup, Term, PriceList, Warehouse, VariationPrice, VariationStock, StockType, Channel } from '@/types';

export const useAddProduct = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();
  const isEditMode = !!productId;
  
  // Form state
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [promotionalText, setPromotionalText] = useState('');
  const [promotionalBgColor, setPromotionalBgColor] = useState('#ffffff');
  const [promotionalTextColor, setPromotionalTextColor] = useState('#000000');
  const [sizesImageUrl, setSizesImageUrl] = useState<string | null>(null);
  const [sizesRefImageUrl, setSizesRefImageUrl] = useState<string | null>(null);
  // URLs de imágenes de tallas ya persistidas que se borrarán del storage al guardar
  const [sizesImagesToDelete, setSizesImagesToDelete] = useState<string[]>([]);
  // URLs subidas en esta sesión (aún no persistidas): se borran del storage al instante
  const [sizesImagesUploadedNow, setSizesImagesUploadedNow] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isWeb, setIsWeb] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>(getTodayDate());
  const [originalIsVariable, setOriginalIsVariable] = useState(false);

  // Exhibición: el rango se conserva en el estado aunque se apague el switch;
  // es `isExhibition` el que decide si se envía el rango o se manda en null.
  const [isExhibition, setIsExhibition] = useState(false);
  const [exhibitionFrom, setExhibitionFrom] = useState<string>(getLimaDateTimeNow());
  const [exhibitionTo, setExhibitionTo] = useState<string>('');
  
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
  // Etiquetas y marcas: el backend las devuelve ya separadas por `type`,
  // pero ambas se persisten en la misma tabla product_tags.
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
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
      setTags(adapted.tags);
      setBrands(adapted.brands);

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
      setPromotionalText(adapted.product.promotionalText);
      setPromotionalBgColor(adapted.product.promotionalBgColor);
      setPromotionalTextColor(adapted.product.promotionalTextColor);
      setSizesImageUrl(adapted.product.sizesImageUrl);
      setSizesRefImageUrl(adapted.product.sizesRefImageUrl);
      setDescription(adapted.product.description);
      setIsVariable(adapted.product.isVariable);
      setIsActive(adapted.product.isActive);
      setIsWeb(adapted.product.isWeb);
      if (adapted.product.createdAt) setCreatedAt(adapted.product.createdAt);

      // Exhibición: el switch se deriva de si el producto trae el rango completo.
      // Si no lo trae, se dejan los valores por defecto (inicio = ahora, fin vacío)
      // para que activar el switch al editar se comporte igual que al crear.
      const hasExhibition = !!(adapted.product.exhibitionFrom && adapted.product.exhibitionTo);
      setIsExhibition(hasExhibition);
      if (hasExhibition) {
        setExhibitionFrom(adapted.product.exhibitionFrom);
        setExhibitionTo(adapted.product.exhibitionTo);
      }
      setOriginalIsVariable(adapted.product.isVariable);
      setSelectedCategories(adapted.categories);
      setSelectedChannels(adapted.channels);
      setSelectedTags(adapted.tags);
      setSelectedBrands(adapted.brands);
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

  // ---- Imagen de tallas / de referencia (una sola imagen por campo) ----

  type SizeImageKind = 'sizes' | 'sizes-ref';

  const setSizeImageUrl = (kind: SizeImageKind, url: string | null) => {
    if (kind === 'sizes') setSizesImageUrl(url);
    else setSizesRefImageUrl(url);
  };

  /**
   * Suelta la URL anterior del campo: si se subió en esta sesión se borra del storage
   * al instante; si ya estaba persistida se encola para borrarla al guardar.
   */
  const discardSizeImage = async (url: string) => {
    if (sizesImagesUploadedNow.includes(url)) {
      setSizesImagesUploadedNow(prev => prev.filter(u => u !== url));
      try {
        await AddProductService.deleteImageByUrl(url);
      } catch (error) {
        console.error('Error deleting size image from storage:', error);
      }
      return;
    }
    setSizesImagesToDelete(prev => prev.includes(url) ? prev : [...prev, url]);
  };

  const handleSizeImageUpload = async (file: File, kind: SizeImageKind) => {
    setLoading(true);
    try {
      const previousUrl = kind === 'sizes' ? sizesImageUrl : sizesRefImageUrl;
      const { url } = await AddProductService.uploadSizeImage(file, kind);

      if (previousUrl) await discardSizeImage(previousUrl);

      setSizesImagesUploadedNow(prev => [...prev, url]);
      setSizeImageUrl(kind, url);

      toast({
        title: "Imagen subida",
        description: "Imagen subida correctamente"
      });
    } catch (error) {
      console.error('Error uploading size image:', error);
      toast({
        title: "Error",
        description: "Error al subir la imagen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSizeImage = async (kind: SizeImageKind) => {
    const url = kind === 'sizes' ? sizesImageUrl : sizesRefImageUrl;
    if (!url) return;

    await discardSizeImage(url);
    setSizeImageUrl(kind, null);
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

  const createCategory = async (payload: { name: string; parent_category: number | null }): Promise<boolean> => {
    try {
      await createCategoryApi({
        name: payload.name,
        parent_category: payload.parent_category,
        description: null,
        image_url: null,
      });
      const list = await categoriesListApi();
      setCategories(list);
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente"
      });
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive"
      });
      return false;
    }
  };

  const createTagInline = async (name: string): Promise<ProductTag | null> => {
    try {
      const result = await createTag({ name, code: slugify(name) });
      const newTag: ProductTag = {
        id: result.data.id,
        name: result.data.name,
        code: result.data.code,
        type: result.data.type,
      };
      setTags(prev => [...prev, newTag]);
      setSelectedTags(prev => [...prev, newTag.id]);
      toast({ title: "Tag creado correctamente" });
      return newTag;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la etiqueta",
        variant: "destructive"
      });
      try {
        const data = await AddProductService.getFormData();
        setTags(AddProductAdapter.adaptFormData(data).tags);
      } catch {
        // si falla el refresh, se mantiene el listado actual
      }
      return null;
    }
  };

  const createBrandInline = async (name: string): Promise<ProductBrand | null> => {
    try {
      const result = await createBrand({ name, code: slugify(name) });
      const newBrand: ProductBrand = {
        id: result.data.id,
        name: result.data.name,
        code: result.data.code,
        type: result.data.type,
      };
      setBrands(prev => [...prev, newBrand]);
      setSelectedBrands(prev => [...prev, newBrand.id]);
      toast({ title: "Marca creada correctamente" });
      return newBrand;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la marca",
        variant: "destructive"
      });
      try {
        const data = await AddProductService.getFormData();
        setBrands(AddProductAdapter.adaptFormData(data).brands);
      } catch {
        // si falla el refresh, se mantiene el listado actual
      }
      return null;
    }
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

  // ================= Exhibición =================

  /**
   * Rango de exhibición listo para persistir: ISO con offset Lima, o null.
   * Null si el switch está apagado o si el rango quedó incompleto.
   */
  const exhibitionRange: { from: string | null; to: string | null } = isExhibition
    ? {
        from: limaDateTimeLocalToIso(exhibitionFrom) || null,
        to: limaDateTimeLocalToIso(exhibitionTo) || null,
      }
    : { from: null, to: null };

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

    if (isExhibition) {
      if (!exhibitionFrom || !exhibitionTo) {
        toast({
          title: "Error",
          description: "Debe indicar la fecha de inicio y la fecha de fin de exhibición",
          variant: "destructive"
        });
        return false;
      }

      if (exhibitionTo <= exhibitionFrom) {
        toast({
          title: "Error",
          description: "La fecha de fin de exhibición debe ser posterior a la de inicio",
          variant: "destructive"
        });
        return false;
      }
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
        // Las imágenes de tallas ya se subieron al seleccionarlas; aquí solo se persisten sus URLs
        const request = AddProductAdapter.prepareUpdateRequest(
          Number(productId),
          productName,
          shortDescription,
          promotionalText,
          promotionalBgColor,
          promotionalTextColor,
          sizesImageUrl,
          sizesRefImageUrl,
          description,
          isVariable,
          isActive,
          isWeb,
          originalIsVariable,
          selectedCategories,
          selectedChannels,
          productImages,
          variations,
          attributesHaveChanged,
          createdAt,
          selectedTags,
          selectedBrands,
          exhibitionRange.from,
          exhibitionRange.to
        );

        const result = await AddProductService.updateProduct(request);

        if (!result.success) {
          throw new Error(result.error || 'Error al actualizar el producto');
        }

        // Save sizes image URLs directly to the products table
        await supabase
          .from('products')
          .update({ sizes_image_url: sizesImageUrl, sizes_ref_image_url: sizesRefImageUrl })
          .eq('id', Number(productId));

        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente"
        });
      } else {
        // Las imágenes de tallas ya se subieron al seleccionarlas; solo falta asociarlas al nuevo producto
        const request = AddProductAdapter.prepareCreateRequest(
          productName,
          shortDescription,
          promotionalText,
          promotionalBgColor,
          promotionalTextColor,
          sizesImageUrl,
          sizesRefImageUrl,
          description,
          isVariable,
          isActive,
          isWeb,
          selectedCategories,
          selectedChannels,
          productImages,
          variations,
          createdAt,
          selectedTags,
          selectedBrands,
          exhibitionRange.from,
          exhibitionRange.to
        );

        const result = await AddProductService.createProduct(request);

        if (!result.success) {
          throw new Error(result.error || 'Error al crear el producto');
        }

        // create-product no persiste estos campos → se guardan aquí
        if (result.product?.id && (sizesImageUrl || sizesRefImageUrl)) {
          await supabase
            .from('products')
            .update({ sizes_image_url: sizesImageUrl, sizes_ref_image_url: sizesRefImageUrl })
            .eq('id', result.product.id);
        }

        toast({
          title: "Éxito",
          description: result.message || "Producto creado correctamente"
        });
      }

      // Ya persistido el NULL en BD: recién ahora se borran del storage las imágenes quitadas
      for (const url of sizesImagesToDelete) {
        try {
          await AddProductService.deleteImageByUrl(url);
        } catch (error) {
          console.error('Error deleting size image from storage:', error);
        }
      }
      setSizesImagesToDelete([]);

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
    productId,
    
    // Form state
    productName,
    setProductName,
    shortDescription,
    setShortDescription,
    promotionalText,
    setPromotionalText,
    promotionalBgColor,
    setPromotionalBgColor,
    promotionalTextColor,
    setPromotionalTextColor,
    sizesImageUrl,
    sizesRefImageUrl,
    handleSizeImageUpload,
    removeSizeImage,
    description,
    setDescription,
    selectedCategories,
    isVariable,
    isActive,
    isWeb,
    createdAt,
    setIsVariable,
    setIsActive,
    setIsWeb,
    setCreatedAt,

    // Exhibición
    isExhibition,
    setIsExhibition,
    exhibitionFrom,
    setExhibitionFrom,
    exhibitionTo,
    setExhibitionTo,
    exhibitionRange,

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
    tags,
    brands,
    selectedTags,
    selectedBrands,
    selectedStockType,
    setSelectedStockType,
    
    // Loading
    loading,
    isLoadingProduct,
    initialDataLoaded,
    
    // Handlers
    toggleCategorySelection,
    createCategory,
    createTagInline,
    createBrandInline,
    toggleChannelSelection: (channelId: number) => {
      setSelectedChannels(prev => 
        prev.includes(channelId)
          ? prev.filter(id => id !== channelId)
          : [...prev, channelId]
      );
    },
    toggleTagSelection: (tagId: number) => {
      setSelectedTags(prev =>
        prev.includes(tagId)
          ? prev.filter(id => id !== tagId)
          : [...prev, tagId]
      );
    },
    toggleBrandsSelection: (brandId: number) => {
      setSelectedBrands(prev =>
        prev.includes(brandId)
          ? prev.filter(id => id !== brandId)
          : [...prev, brandId]
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
