import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserFunctionsApi } from '@/layouts/services/layout.service';
import { UserFunction } from '@/layouts/types/layout.types';

interface MenuFunction extends UserFunction {
  subItems?: {
    label: string;
    items: UserFunction[];
  }[];
}

export const useFunctions = () => {
  const [functions, setFunctions] = useState<MenuFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        // 1. Get allowed functions (permissions) from Edge Function
        const response = await getUserFunctionsApi();

        if (response.success && response.session?.functions) {
          const allowedIds = response.session.functions.map((f: any) => f.id);

          // 2. Get full metadata for all active functions from the table
          const { data: allFunctions, error: tableError } = await supabase
            .from('functions')
            .select('*')
            .eq('active', true)
            .order('order', { ascending: true, nullsFirst: false });

          if (tableError) throw tableError;

          // 3. Filter full list by allowed IDs
          const filteredFunctions = (allFunctions || []).filter(f => allowedIds.includes(f.id));

          // 4. Transform to hierarchical structure
          const transformedFunctions = transformToMenuStructure(filteredFunctions as UserFunction[]);
          setFunctions(transformedFunctions);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (err) {
        console.error("Error in useFunctions:", err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  return { functions, loading, error };
};

const transformToMenuStructure = (functions: UserFunction[]): MenuFunction[] => {
  // Get all parent functions (those without parent_function) and sort by order
  const parentFunctions = functions
    .filter(f => f.parent_function === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return parentFunctions.map(parent => {
    // Check if this parent has children
    const children = functions
      .filter(f => f.parent_function === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (children.length === 0) {
      return parent;
    }

    // Find children that have their own children (Level 2 items with grandchildren)
    const groups = children.filter(child => {
      const grandchildren = functions.filter(f => f.parent_function === child.id);
      return grandchildren.length > 0;
    });

    // Find children without children (direct items with location)
    const directItems = children.filter(child => {
      const grandchildren = functions.filter(f => f.parent_function === child.id);
      return grandchildren.length === 0;
    });

    // If we have groups (children with grandchildren), create hierarchical structure
    if (groups.length > 0) {
      const subItems = groups.map(group => ({
        label: group.name,
        items: functions
          .filter(f => f.parent_function === group.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }));

      // If there are also direct items, add them as a group with the parent name
      if (directItems.length > 0) {
        subItems.unshift({
          label: parent.name,
          items: directItems
        });
      }

      return {
        ...parent,
        subItems
      };
    }

    // If no groups, create simple structure with parent name as label
    const subItems = [{
      label: parent.name,
      items: directItems
    }];

    return {
      ...parent,
      subItems
    };
  });
};