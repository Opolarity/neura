import type { 
  ProductFormDataResponse, 
  ProductDetailsResponse,
  ProductImage,
  ProductVariation,
  CreateProductRequest,
  UpdateProductRequest
} from '../types/AddProduct.types';
import type { Category, TermGroup, Term, PriceList, Warehouse, VariationPrice, VariationStock, StockType } from '@/types';

export const AddProductAdapter = {
  /**
   * Adapta la respuesta del formulario a los tipos del frontend
   */
  adaptFormData(data: ProductFormDataResponse): {
    categories: Category[];
    termGroups: TermGroup[];
    terms: Term[];
    priceLists: PriceList[];
    warehouses: Warehouse[];
    stockTypes: StockType[];
    channels: { id: number; name: string; code: string }[];
  } {
    return {
      categories: data.categories || [],
      termGroups: data.termGroups || [],
      terms: data.terms || [],
      priceLists: data.priceLists || [],
      warehouses: (data.warehouses || []).map((w: any) => ({ 
        id: w.id, 
        name: String(w.name),
        country_id: w.country_id ?? 0,
        state_id: w.state_id ?? 0,
        city_id: w.city_id ?? 0,
        neighborhood_id: w.neighborhood_id ?? 0,
        address: w.address ?? "",
        address_reference: w.address_reference ?? "",
        web: w.web ?? false,
        is_active: w.is_active ?? true,
      })),
      stockTypes: (data.stockTypes || []).map((st: any) => ({
        id: st.id,
        code: st.code,
        name: st.name
      })),
      channels: (data.channels || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        code: ch.code
      }))
    };
  },

  /**
   * Adapta los detalles del producto para edición
   */
  adaptProductDetails(
    data: ProductDetailsResponse,
    terms: Term[],
    priceLists: PriceList[],
    warehouses: Warehouse[]
  ): {
    product: {
      title: string;
      shortDescription: string;
      description: string;
      isVariable: boolean;
      isActive: boolean;
      isWeb: boolean;
    };
    categories: number[];
    channels: number[];
    images: ProductImage[];
    variations: ProductVariation[];
    variationSkus: Record<string, string>;
    selectedTerms: Record<number, number[]>;
  } {
    const product = {
      title: data.product.title,
      shortDescription: data.product.short_description || '',
      description: data.product.description || '',
      isVariable: data.product.is_variable,
      isActive: data.product.active,
      isWeb: data.product.web
    };

    const categories = data.categories || [];

    const images: ProductImage[] = (data.images || []).map((img, index) => ({
      file: new File([], 'existing'),
      preview: img.image_url,
      id: `existing-${img.id}`,
      order: img.image_order || index
    }));

    const variationSkus: Record<string, string> = {};
    const collectedTerms: Record<number, number[]> = {};

    const variations: ProductVariation[] = (data.variations || []).map((variation) => {
      const varId = `db-${variation.id}`;
      
      if (variation.sku) {
        variationSkus[varId] = variation.sku;
      }

      const attributes = (variation.terms || []).map((termId: number) => {
        const term = terms.find(t => t.id === termId);
        
        // Collect terms for selectedTerms state
        if (term && data.product.is_variable) {
          if (!collectedTerms[term.term_group_id]) {
            collectedTerms[term.term_group_id] = [];
          }
          if (!collectedTerms[term.term_group_id].includes(termId)) {
            collectedTerms[term.term_group_id].push(termId);
          }
        }

        return {
          term_group_id: term?.term_group_id || 0,
          term_id: termId
        };
      });

      // Map prices ensuring all price lists are represented
      const prices: VariationPrice[] = priceLists.map(pl => {
        const existingPrice = (variation.prices || []).find(p => p.price_list_id === pl.id);
        return {
          price_list_id: pl.id,
          price: existingPrice?.price !== null ? Number(existingPrice?.price) : undefined,
          sale_price: existingPrice?.sale_price !== null ? Number(existingPrice?.sale_price) : undefined
        };
      });

      // Map stock ensuring all warehouses are represented (grouped by stock_type_id)
      const stock: VariationStock[] = (variation.stock || []).map((s: any) => ({
        warehouse_id: s.warehouse_id,
        stock: s.stock !== null && s.stock !== undefined ? Number(s.stock) : undefined,
        stock_type_id: s.stock_type_id,
        hadInitialValue: true
      }));

      const selectedImages = (variation.images || []).map((imgId: number) => `existing-${imgId}`);

      return {
        id: varId,
        attributes,
        prices,
        stock,
        selectedImages
      };
    });

    return {
      product,
      categories,
      channels: data.channels || [],
      images,
      variations,
      variationSkus,
      selectedTerms: collectedTerms
    };
  },

  /**
   * Prepara los datos para crear un producto
   */
  prepareCreateRequest(
    productName: string,
    shortDescription: string,
    description: string,
    isVariable: boolean,
    isActive: boolean,
    isWeb: boolean,
    selectedCategories: number[],
    selectedChannels: number[],
    productImages: ProductImage[],
    variations: ProductVariation[]
  ): CreateProductRequest {
    const sortedImages = [...productImages].sort((a, b) => a.order - b.order);
    
    const imageRefs = sortedImages.map(image => ({
      id: image.id,
      path: image.id,
      order: image.order
    }));

    const sanitizedVariations = this.sanitizeVariations(variations, isVariable);

    return {
      productName,
      shortDescription,
      description,
      isVariable,
      isActive,
      isWeb,
      selectedCategories,
      selectedChannels,
      productImages: imageRefs,
      variations: sanitizedVariations
    };
  },

  /**
   * Prepara los datos para actualizar un producto
   */
  prepareUpdateRequest(
    productId: number,
    productName: string,
    shortDescription: string,
    description: string,
    isVariable: boolean,
    isActive: boolean,
    isWeb: boolean,
    originalIsVariable: boolean,
    selectedCategories: number[],
    selectedChannels: number[],
    productImages: ProductImage[],
    variations: ProductVariation[],
    resetVariations: boolean = false
  ): UpdateProductRequest {
    const imageRefs = productImages.map(img => ({
      id: img.id,
      path: img.id.startsWith('existing-') ? img.preview : img.id,
      order: img.order
    }));

    const sanitizedVariations = this.sanitizeVariations(variations, isVariable);

    return {
      productId,
      productName,
      shortDescription,
      description,
      isVariable,
      isActive,
      isWeb,
      originalIsVariable,
      selectedCategories,
      selectedChannels,
      productImages: imageRefs,
      variations: sanitizedVariations,
      resetVariations
    };
  },

  /**
   * Sanitiza las variaciones eliminando duplicados y normalizando valores
   */
  sanitizeVariations(variations: ProductVariation[], isVariable: boolean) {
    const seen = new Set<string>();
    
    const normalize = (v: ProductVariation) => v.attributes
      .map(a => `${a.term_group_id}:${a.term_id}`)
      .sort()
      .join('|');

    const base = isVariable 
      ? variations.filter(v => v.attributes.length > 0) 
      : variations.slice(0, 1);

    return base
      .filter(v => {
        const key = normalize(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(v => ({
        ...v,
        prices: v.prices.map(p => ({
          ...p,
          price: Number(p.price) || 0,
          sale_price: (p.sale_price === null || p.sale_price === undefined || Number(p.sale_price) === 0) 
            ? null 
            : Number(p.sale_price),
        })),
        // Solo enviar almacenes que tienen stock definido (filtrar undefined/null)
        stock: v.stock
          .filter(s => s.stock !== undefined && s.stock !== null)
          .map(s => ({ 
            warehouse_id: s.warehouse_id, 
            stock: Number(s.stock),
            stock_type_id: s.stock_type_id
          })),
      }));
  }
};
