import { MultiSelect } from '@/shared/components/MultiSelect';

interface Props {
  label: string;
  options: { value: string; label: string }[];
  /** Valores marcados; `null` = sin filtro (todos). */
  value: string[] | null;
  /** Recibe `null` cuando no queda nada marcado: el backend lo lee como "todos". */
  onChange: (values: string[] | null) => void;
  placeholder: string;
  width?: string;
}

/**
 * T-560: filtro de alcance de selección múltiple (sucursal, canal, método de
 * pago, lista de precios). Nada marcado = todos, igual que el "Todas" del
 * Select que reemplaza.
 */
export function MultiScopeFilter({ label, options, value, onChange, placeholder, width = 'w-[180px]' }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${width}`}>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <MultiSelect
        className="h-9"
        options={options}
        value={value ?? []}
        onChange={(vals) => onChange(vals.length > 0 ? vals : null)}
        placeholder={placeholder}
        showSearch={options.length > 8}
        showClear
        maxVisible={1}
      />
    </div>
  );
}
