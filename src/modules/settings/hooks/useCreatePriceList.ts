import { useState } from "react";
import { createPriceListApi } from "../services/PriceList.service";
import { PriceListPayload } from "../types/PriceList.types";
import { toast } from "sonner";

export const useCreatePriceList = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const savePriceList = async (newPriceList: PriceListPayload) => {
    setLoading(true);
    try {
      const res = await createPriceListApi(newPriceList);
      console.log(res);
      toast.success("Precio de Lista creado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Precio de Lista no creado");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };
  const onOpenChange = (o: boolean) => {
    setOpen(o);
  };

  return {
    open,
    loading,
    savePriceList,
    onOpenChange,
  };
};
