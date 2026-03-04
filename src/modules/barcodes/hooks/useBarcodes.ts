import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  getActivePriceLists,
  getNextSequence,
  getLastSequenceByStockMovement,
  getVariationPrice,
  createBarcodeApi,
  fetchBarcodesList,
} from "../services/Barcodes.service";
import {
  priceListsAdapter,
  barcodeListAdapter,
} from "../adapters/Barcodes.adapter";
import {
  VariationOption,
  StockMovementOption,
  PriceListOption,
  BarcodeTicketData,
  BarcodeListItem,
} from "../types/Barcodes.types";
import { generateBarcodePdf } from "../utils/generateBarcodePdf";

export const useBarcodes = () => {
  // Select options
  const [priceLists, setPriceLists] = useState<PriceListOption[]>([]);

  // Selected values
  const [selectedVariation, setSelectedVariation] = useState<VariationOption | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovementOption | null>(null);
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);

  // Locked state (when movement selected)
  const [productLocked, setProductLocked] = useState(false);

  // Computed
  const [sequence, setSequence] = useState<number>(1);
  const [quantities, setQuantities] = useState<number>(1);
  const [price, setPrice] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Barcode list
  const [barcodeList, setBarcodeList] = useState<BarcodeListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // ==========================================================================
  // Load barcode list
  // ==========================================================================

  const loadBarcodeList = useCallback(async () => {
    try {
      setListLoading(true);
      const raw = await fetchBarcodesList();
      setBarcodeList(barcodeListAdapter(raw));
    } catch (error: any) {
      console.error("Error loading barcode list:", error);
    } finally {
      setListLoading(false);
    }
  }, []);

  // ==========================================================================
  // Load initial data (only price lists now, searchers load their own data)
  // ==========================================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        const priceListsRaw = await getActivePriceLists();
        setPriceLists(priceListsAdapter(priceListsRaw));
      } catch (error: any) {
        console.error("Error loading barcode data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
    loadBarcodeList();
  }, [loadBarcodeList]);

  // ==========================================================================
  // Handle variation change → compute sequence
  // ==========================================================================

  const handleVariationChange = useCallback(async (variation: VariationOption) => {
    setSelectedVariation(variation);
    setPrice(null);

    try {
      const nextSeq = await getNextSequence(variation.variationId);
      setSequence(nextSeq);
    } catch (error) {
      console.error("Error getting sequence:", error);
      setSequence(1);
    }

    // If price list already selected, fetch price
    if (selectedPriceListId) {
      try {
        const priceData = await getVariationPrice(variation.variationId, selectedPriceListId);
        setPrice(priceData?.price ?? null);
      } catch {
        setPrice(null);
      }
    }
  }, [selectedPriceListId]);

  // ==========================================================================
  // Handle stock movement selection
  // ==========================================================================

  const handleStockMovementChange = useCallback(async (movement: StockMovementOption | null) => {
    if (movement) {
      setSelectedMovement(movement);
      setProductLocked(true);
      setQuantities(movement.quantity);
      // Build a VariationOption from movement data
      const variationFromMovement: VariationOption = {
        variationId: movement.productVariationId,
        sku: movement.sku,
        productTitle: movement.productTitle,
        terms: movement.variationTerms,
        label: movement.variationTerms
          ? `${movement.productTitle} (${movement.variationTerms})`
          : movement.productTitle,
        stockTypeName: null,
      };
      await handleVariationChange(variationFromMovement);

      // If this stock movement already has barcodes, reuse the last sequence
      try {
        const lastSeq = await getLastSequenceByStockMovement(movement.id);
        if (lastSeq !== null) {
          setSequence(lastSeq);
        }
      } catch (err) {
        console.error("Error fetching last sequence for stock movement:", err);
      }
    } else {
      setSelectedMovement(null);
      setProductLocked(false);
      setSelectedVariation(null);
      setQuantities(1);
      setSequence(1);
      setPrice(null);
    }
  }, [handleVariationChange]);

  // ==========================================================================
  // Handle product clear (when not locked)
  // ==========================================================================

  const handleProductClear = useCallback(() => {
    setSelectedVariation(null);
    setSequence(1);
    setPrice(null);
  }, []);

  // ==========================================================================
  // Handle price list change → fetch price
  // ==========================================================================

  const handlePriceListChange = useCallback(async (priceListId: number) => {
    setSelectedPriceListId(priceListId);

    if (selectedVariation) {
      try {
        const priceData = await getVariationPrice(selectedVariation.variationId, priceListId);
        setPrice(priceData?.price ?? null);
      } catch {
        setPrice(null);
      }
    }
  }, [selectedVariation]);

  // ==========================================================================
  // Submit
  // ==========================================================================

  const handleSubmit = async () => {
    if (!selectedVariation || !selectedPriceListId || !quantities || quantities < 1) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (price === null) {
      toast({
        title: "Error",
        description: "No se encontró precio para esta variación y lista de precios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createBarcodeApi({
        product_variation_id: selectedVariation.variationId,
        price_list_id: selectedPriceListId,
        stock_movement_id: selectedMovement?.id ?? null,
        sequence,
        quantities,
      });

      const ticketData: BarcodeTicketData = {
        productTitle: selectedVariation.productTitle,
        variationTerms: selectedVariation.terms,
        sku: selectedVariation.sku,
        price: price,
        barcodeValue: `${selectedVariation.variationId}-${sequence}`,
      };

      generateBarcodePdf(ticketData, quantities);

      toast({
        title: "Éxito",
        description: `Se generaron ${quantities} etiquetas de código de barras`,
      });

      setModalOpen(false);
      loadBarcodeList();
    } catch (error: any) {
      console.error("Error creating barcode:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el código de barras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Reset and reopen modal
  // ==========================================================================

  const handleNewBarcode = () => {
    setSelectedVariation(null);
    setSelectedMovement(null);
    setSelectedPriceListId(null);
    setProductLocked(false);
    setSequence(1);
    setQuantities(1);
    setPrice(null);
    setModalOpen(true);
  };

  // ==========================================================================
  // Reprint from list
  // ==========================================================================

  const handleReprint = async (item: BarcodeListItem) => {
    try {
      const priceData = await getVariationPrice(item.variationId, item.priceListId);
      if (!priceData?.price) {
        toast({ title: "Error", description: "No se encontró el precio", variant: "destructive" });
        return;
      }
      const ticketData: BarcodeTicketData = {
        productTitle: item.productTitle,
        variationTerms: item.variationTerms,
        sku: item.sku,
        price: priceData.price,
        barcodeValue: item.barcodeValue,
      };
      generateBarcodePdf(ticketData, item.quantities ?? 1);
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo reimprimir", variant: "destructive" });
    }
  };

  return {
    // Data
    priceLists,
    barcodeList,
    // Selected
    selectedVariation,
    selectedMovement,
    selectedPriceListId,
    sequence,
    quantities,
    price,
    productLocked,
    // State
    loading,
    initialLoading,
    listLoading,
    modalOpen,
    // Handlers
    setQuantities,
    setSequence,
    setModalOpen,
    handleVariationChange,
    handleStockMovementChange,
    handleProductClear,
    handlePriceListChange,
    handleSubmit,
    handleNewBarcode,
    handleReprint,
  };
};
