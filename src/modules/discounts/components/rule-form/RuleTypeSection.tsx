import { Ticket, Zap } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { PriceRuleFormData } from "../../types/priceRule.types";
import { CouponSection } from "./CouponSection";
import { CartMessagesSection } from "./CartMessagesSection";

interface RuleTypeSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

const OPTIONS: Array<{
  value: PriceRuleFormData["rule_type"];
  title: string;
  description: string;
  icon: typeof Zap;
}> = [
  {
    value: "automatic",
    title: "Automática",
    description: "Se aplica en la venta cuando se cumplen las condiciones.",
    icon: Zap,
  },
  {
    value: "coupon",
    title: "Con cupón",
    description: "Se aplica cuando el cliente ingresa el código del cupón.",
    icon: Ticket,
  },
];

export const RuleTypeSection = ({ formData, updateField }: RuleTypeSectionProps) => {
  return (
    <div className="space-y-4">
      <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map(({ value, title, description, icon: Icon }) => {
          const selected = formData.rule_type === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => updateField("rule_type", value)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {formData.rule_type === "coupon" && (
        <CouponSection formData={formData} updateField={updateField} />
      )}

      {formData.rule_type === "automatic" && (
        <CartMessagesSection formData={formData} updateField={updateField} />
      )}
    </div>
  );
};
