import { createContext, useContext } from "react";
import { FunctionsContextType } from "../types";

const FunctionsContext = createContext<FunctionsContextType | undefined>(undefined);

export const useFunctionsContext = () => {
  const ctx = useContext(FunctionsContext);
  if (!ctx) throw new Error("useFunctionsContext must be used within FunctionsProvider");
  return ctx;
};

export default FunctionsContext;
