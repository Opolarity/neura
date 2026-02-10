import { useState } from "react";

export const useInvoices = () => {
  const [invoice, setInvoice] = useState("Jeampier");

  return { invoice };
};
