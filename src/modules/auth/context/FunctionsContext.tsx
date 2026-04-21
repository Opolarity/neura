import { createContext } from "react";
import { FunctionsContextType } from "../types";

const FunctionsContext = createContext<FunctionsContextType | undefined>(undefined);

export default FunctionsContext;
