import { createContext, useContext } from "react";

export interface CatalogCategoryInfo {
  categoryId: number | null;
  categoryName: string;
  categoryImage: string | null;
}

const CatalogCategoryContext = createContext<CatalogCategoryInfo | null>(null);

export function CatalogCategoryProvider({
  value,
  children,
}: {
  value: CatalogCategoryInfo;
  children: React.ReactNode;
}) {
  return (
    <CatalogCategoryContext.Provider value={value}>
      {children}
    </CatalogCategoryContext.Provider>
  );
}

// null cuando el componente no esta dentro del catalogo (p.ej. en el editor).
export function useCatalogCategory(): CatalogCategoryInfo | null {
  return useContext(CatalogCategoryContext);
}
