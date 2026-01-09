import { useState } from "react";

export const useProductSelection = () => {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleAll = (ids: number[]) =>
    setSelected((prev) => (prev.length === ids.length ? [] : ids));

  return { selected, toggle, toggleAll, clear: () => setSelected([]) };
};
