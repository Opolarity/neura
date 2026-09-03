import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

// `required` marca visualmente el campo como obligatorio. Es la única forma
// admitida de hacerlo (T-603): nada de escribir el "*" dentro del texto del
// label, que es como estaba y por eso el marcado y la validación divergían.
//
// El asterisco va SIN color: `neura-styles` reserva `destructive` para error y
// eliminar, y un campo vacío que todavía no se ha enviado no es un error. Y va
// `aria-hidden` porque la semántica accesible la da el control (`required` /
// `aria-required` en el input o el trigger del select), no el texto.
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  >
    {children}
    {required && (
      <span aria-hidden="true" className="ml-0.5">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
