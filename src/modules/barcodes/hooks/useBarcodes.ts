import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  getVariationsForSelect,
  getStockMovementsByMER,
  getActivePriceLists,
  getNextSequence,
  getVariationPrice,
  createBarcodeApi,
} from "../services/Barcodes.service";
import {
  variationsAdapter,
  stockMovementsAdapter,
  priceListsAdapter,
} from "../adapters/Barcodes.adapter";
import {
  VariationOption,
  StockMovementOption,
  PriceListOption,
  BarcodeTicketData,
} from "../types/Barcodes.types";
import { generateBarcodePdf } from "../utils/generateBarcodePdf";

export const useBarcodes = () => {
  // Select options
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementOption[]>([]);
  const [priceLists, setPriceLists] = useState<PriceListOption[]>([]);

  // Selected values
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
  const [selectedStockMovementId, setSelectedStockMovementId] = useState<number | null>(null);
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);

  // Computed
  const [sequence, setSequence] = useState<number>(1);
  const [quantities, setQuantities] = useState<number>(1);
  const [price, setPrice] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(true);

  // ==========================================================================
  // Load initial data
  // ==========================================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        const [variationsRaw, stockMovementsRaw, priceListsRaw] = await Promise.all([
          getVariationsForSelect(),
          getStockMovementsByMER(),
          getActivePriceLists(),
        ]);

        setVariations(variationsAdapter(variationsRaw));
        setStockMovements(stockMovementsAdapter(stockMovementsRaw));
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
  }, []);

  // ==========================================================================
  // Handle variation change → compute sequence
  // ==========================================================================

  const handleVariationChange = useCallback(async (variationId: number) => {
    setSelectedVariationId(variationId);
    setPrice(null);

    try {
      const nextSeq = await getNextSequence(variationId);
      setSequence(nextSeq);
    } catch (error) {
      console.error("Error getting sequence:", error);
      setSequence(1);
    }

    // If price list already selected, fetch price
    if (selectedPriceListId) {
      try {
        const priceData = await getVariationPrice(variationId, selectedPriceListId);
        setPrice(priceData?.price ?? null);
      } catch {
        setPrice(null);
      }
    }
  }, [selectedPriceListId]);

  // ==========================================================================
  // Handle price list change → fetch price
  // ==========================================================================

  const handlePriceListChange = useCallback(async (priceListId: number) => {
    setSelectedPriceListId(priceListId);

    if (selectedVariationId) {
      try {
        const priceData = await getVariationPrice(selectedVariationId, priceListId);
        setPrice(priceData?.price ?? null);
      } catch {
        setPrice(null);
      }
    }
  }, [selectedVariationId]);

  // ==========================================================================
  // Submit
  // ==========================================================================

  const handleSubmit = async () => {
    if (!selectedVariationId || !selectedPriceListId || !quantities || quantities < 1) {
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
      // 1. Create barcode record
      await createBarcodeApi({
        product_variation_id: selectedVariationId,
        price_list_id: selectedPriceListId,
        stock_movement_id: selectedStockMovementId,
        sequence,
        quantities,
      });

      // 2. Get variation data for PDF
      const selectedVariation = variations.find(
        (v) => v.variationId === selectedVariationId
      );

      if (!selectedVariation) throw new Error("Variación no encontrada");

      const ticketData: BarcodeTicketData = {
        productTitle: selectedVariation.productTitle,
        variationTerms: selectedVariation.terms,
        price: price,
        barcodeValue: `${selectedVariationId}-${sequence}`,
      };

      // 3. Generate PDF
      generateBarcodePdf(ticketData, quantities);

      toast({
        title: "Éxito",
        description: `Se generaron ${quantities} etiquetas de código de barras`,
      });

      setModalOpen(false);
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
    setSelectedVariationId(null);
    setSelectedStockMovementId(null);
    setSelectedPriceListId(null);
    setSequence(1);
    setQuantities(1);
    setPrice(null);
    setModalOpen(true);
  };

  return {
    // Data
    variations,
    stockMovements,
    priceLists,
    // Selected
    selectedVariationId,
    selectedStockMovementId,
    selectedPriceListId,
    sequence,
    quantities,
    price,
    // State
    loading,
    initialLoading,
    modalOpen,
    // Handlers
    setSelectedStockMovementId,
    setQuantities,
    setModalOpen,
    handleVariationChange,
    handlePriceListChange,
    handleSubmit,
    handleNewBarcode,
  };
};
