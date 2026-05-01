import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/modules/auth';
import { UserFunction } from '@/layouts/types/layout.types';

interface MenuFunction extends UserFunction {
  subItems?: {
    label: string;
    items: UserFunction[];
  }[];
}

export const useFunctions = () => {
  const { permissions } = useAuth();
  const [functions, setFunctions] = useState<MenuFunction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permissions.permissionsLoading) return;

    const buildMenu = async () => {
      setLoading(true);

      let funcs: UserFunction[] = permissions.functionData;

      // Si el SP devolvió functions pero sin parent_function (SP viejo),
      // completamos los datos desde la tabla usando los IDs permitidos
      const hasFullData = funcs.length > 0 && funcs[0].parent_function !== undefined;

      if (!hasFullData) {
        const query = supabase
          .from('functions')
          .select('*')
          .eq('active', true)
          .order('order', { ascending: true, nullsFirst: false });

        // Si no es admin, filtrar por IDs permitidos
        if (!permissions.role?.isAdmin && permissions.functionIds.length > 0) {
          query.in('id', permissions.functionIds);
        }

        const { data } = await query;
        funcs = (data || []) as UserFunction[];
      }

      const sorted = [...funcs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFunctions(transformToMenuStructure(sorted));
      setLoading(false);
    };

    buildMenu();
  }, [permissions.permissionsLoading, permissions.functionData, permissions.functionIds, permissions.role?.isAdmin]);

  return { functions, loading, error: null };
};

const transformToMenuStructure = (functions: UserFunction[]): MenuFunction[] => {
  const parentFunctions = functions
    .filter(f => f.parent_function === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return parentFunctions.map(parent => {
    const children = functions
      .filter(f => f.parent_function === parent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (children.length === 0) return parent;

    const groups = children.filter(child =>
      functions.some(f => f.parent_function === child.id)
    );

    const directItems = children.filter(child =>
      !functions.some(f => f.parent_function === child.id)
    );

    if (groups.length > 0) {
      const subItems = groups.map(group => ({
        label: group.name,
        items: functions
          .filter(f => f.parent_function === group.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));

      if (directItems.length > 0) {
        subItems.unshift({ label: parent.name, items: directItems });
      }

      return { ...parent, subItems };
    }

    return { ...parent, subItems: [{ label: parent.name, items: directItems }] };
  });
};
