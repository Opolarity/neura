import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Function {
  id: number;
  name: string;
  code: string | null;
  icon: string | null;
  location: string | null;
  parent_function: number | null;
  active: boolean;
  order: number | null;
}

interface MenuFunction extends Function {
  subItems?: {
    label: string;
    items: Function[];
  }[];
}

export const useFunctions = () => {
  const [functions, setFunctions] = useState<MenuFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        const { data, error } = await supabase
          .from('functions')
          .select('*')
          .eq('active', true)
          .order('order', { ascending: true, nullsFirst: false });

        if (error) throw error;

        // Transform the flat functions data into a hierarchical structure
        const transformedFunctions = transformToMenuStructure(data || []);
        setFunctions(transformedFunctions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  return { functions, loading, error };
};

const transformToMenuStructure = (functions: Function[]): MenuFunction[] => {
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

    // For settings, we need to group by the immediate children (like "Usuarios", "Roles")
    if (parent.code === 'settings') {
      const groups = children.filter(child => {
        // Get grandchildren for this child
        const grandchildren = functions.filter(f => f.parent_function === child.id);
        return grandchildren.length > 0;
      });

      const subItems = groups.map(group => ({
        label: group.name,
        items: functions
          .filter(f => f.parent_function === group.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }));

      return {
        ...parent,
        subItems
      };
    }

    // For other menus like products, create direct submenu structure
    const subItems = [{
      label: parent.name,
      items: children
    }];

    return {
      ...parent,
      subItems
    };
  });
};