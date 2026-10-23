import { cn } from "@/shared/utils/utils";

type Operator = "AND" | "OR";

// "AND"/"OR" en palabras de vendedor. El valor que se guarda no cambia.
const OPTIONS: Array<{ value: Operator; label: string }> = [
  { value: "AND", label: "todas" },
  { value: "OR", label: "al menos una" },
];

export const OPERATOR_CONNECTOR: Record<Operator, string> = {
  AND: "y",
  OR: "o",
};

export const OperatorToggle = ({
  value,
  onChange,
  labels,
}: {
  value: Operator;
  onChange: (operator: Operator) => void;
  labels?: Partial<Record<Operator, string>>;
}) => (
  <div role="radiogroup" className="inline-flex rounded-md border p-0.5">
    {OPTIONS.map((option) => {
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels?.[option.value] ?? option.label}
        </button>
      );
    })}
  </div>
);
