import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserFunctionsApi } from "@/layouts/services/layout.service";
import { UserFunction } from "@/layouts/types/layout.types";

interface MenuFunction extends UserFunction {
  subItems?: {
    label: string;
    items: UserFunction[];
  }[];
}

interface FunctionsContextType {
  functions: MenuFunction[]; // sidebar
  paths: UserFunction[]; // permisos reales (sin transformar)
  loading: boolean;
  error: string | null;
}

const FunctionsContext = createContext<FunctionsContextType | undefined>(
  undefined,
);

const transformToMenuStructure = (
  functions: UserFunction[],
): MenuFunction[] => {
  const parentFunctions = functions
    .filter((f) => f.parent_function === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return parentFunctions.map((parent) => {
    const children = functions
      .filter((f) => f.parent_function === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (children.length === 0) {
      return parent;
    }

    const groups = children.filter((child) => {
      const grandchildren = functions.filter(
        (f) => f.parent_function === child.id,
      );
      return grandchildren.length > 0;
    });

    const directItems = children.filter((child) => {
      const grandchildren = functions.filter(
        (f) => f.parent_function === child.id,
      );
      return grandchildren.length === 0;
    });

    if (groups.length > 0) {
      const subItems = groups.map((group) => ({
        label: group.name,
        items: functions
          .filter((f) => f.parent_function === group.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));

      if (directItems.length > 0) {
        subItems.unshift({
          label: parent.name,
          items: directItems,
        });
      }

      return { ...parent, subItems };
    }

    return {
      ...parent,
      subItems: [{ label: parent.name, items: directItems }],
    };
  });
};

export const FunctionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [functions, setFunctions] = useState<MenuFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<UserFunction[]>([]);

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        const response = await getUserFunctionsApi();

        if (response.success && response.session?.functions) {
          const allowedIds = response.session.functions.map((f: any) => f.id);

          const { data: allFunctions, error: tableError } = await supabase
            .from("functions")
            .select("*")
            .eq("active", true)
            .order("order", { ascending: true, nullsFirst: false });

          if (tableError) throw tableError;

          const filteredFunctions = (allFunctions || []).filter((f) =>
            allowedIds.includes(f.id),
          );

          // 🔹 permisos reales (RUTAS)
          const paths = filteredFunctions;

          // 🔹 solo lo que va al menú
          const menuOnly = filteredFunctions.filter((f) => f.menu);

          // 🔹 estructura del sidebar
          const menuFunctions = transformToMenuStructure(menuOnly);

          setFunctions(menuFunctions);
          setPaths(paths);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (err) {
        console.error("Error in FunctionsProvider:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  return (
    <FunctionsContext.Provider value={{ functions, paths, loading, error }}>
      {children}
    </FunctionsContext.Provider>
  );
};

export const useFunctions = () => {
  const ctx = useContext(FunctionsContext);
  if (!ctx)
    throw new Error("useFunctions must be used within FunctionsProvider");
  return ctx;
};

/*
// NO TOMAR EN CUENTA
//FUNCIÓN POR SI EL BACKEND PONE EN FALSE UN PADRE, ESTO LO TOMA EN CUENTA Y LO RENDERIZA
const includeMenuParents = (functions: UserFunction[]) => {
  const map = new Map(functions.map((f) => [f.id, f]));

  // IDs que son menu
  const menuIds = new Set(functions.filter((f) => f.menu).map((f) => f.id));

  // incluir padres de los menu
  const resultIds = new Set<number>(menuIds);

  menuIds.forEach((id) => {
    let current = map.get(id);
    while (current?.parent_function) {
      resultIds.add(current.parent_function);
      current = map.get(current.parent_function);
    }
  });

  return functions.filter((f) => resultIds.has(f.id));
};
*/