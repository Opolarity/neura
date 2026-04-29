import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/modules/auth';

interface Function {
  id: number;
  name: string;
  code: string | null;
  icon: string | null;
  location: string[] | null;
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
  const { permissions } = useAuth();
  const [allFunctions, setAllFunctions] = useState<Function[]>([]);
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
        setAllFunctions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  useEffect(() => {
    if (permissions.permissionsLoading) return;

    const filtered = permissions.role?.isAdmin
      ? allFunctions
      : allFunctions.filter(f => permissions.functionIds.includes(f.id));

    setFunctions(transformToMenuStructure(filtered));
    setLoading(false);
  }, [allFunctions, permissions.permissionsLoading, permissions.role?.isAdmin, permissions.functionIds]);

  return { functions, loading, error };
};

const transformToMenuStructure = (functions: Function[]): MenuFunction[] => {
  const parentFunctions = functions
    .filter(f => f.parent_function === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return parentFunctions.map(parent => {
    const children = functions
      .filter(f => f.parent_function === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (children.length === 0) {
      return parent;
    }

    const groups = children.filter(child => {
      const grandchildren = functions.filter(f => f.parent_function === child.id);
      return grandchildren.length > 0;
    });

    const directItems = children.filter(child => {
      const grandchildren = functions.filter(f => f.parent_function === child.id);
      return grandchildren.length === 0;
    });

    if (groups.length > 0) {
      const subItems = groups.map(group => ({
        label: group.name,
        items: functions
          .filter(f => f.parent_function === group.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }));

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
