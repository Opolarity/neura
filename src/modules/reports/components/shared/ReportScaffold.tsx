import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils/utils';

interface ReportCardProps {
  title?: ReactNode;
  /** Nota metodológica bajo el título — texto corto, sin color propio. */
  description?: ReactNode;
  /**
   * Explicación del gráfico: qué mide, cómo se agrupa y qué queda fuera. Se
   * muestra en un tooltip detrás de un ícono (i) junto al título, para que
   * cualquiera pueda leerla sin que ocupe lugar en la tarjeta.
   */
  info?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ReportCard({ title, description, info, actions, children, className, contentClassName }: ReportCardProps) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <Card className={cn('overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          {(title || description) && (
            <div className="min-w-0 space-y-1">
              {title && (
                <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                  <span className="min-w-0">{title}</span>
                  {info && <ReportInfoTip>{info}</ReportInfoTip>}
                </CardTitle>
              )}
              {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </div>
          )}
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn(hasHeader ? 'pt-0' : undefined, contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Ícono (i) con tooltip. El TooltipProvider global vive en App.tsx. Es un
 * botón para que sea alcanzable con teclado y se abra también con foco.
 */
export function ReportInfoTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Cómo se calcula este gráfico"
          className="inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs text-xs font-normal leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

interface ReportSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function ReportSelect<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: ReportSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as T)}>
      <SelectTrigger className={cn('h-9', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ChartLoading({ className = 'h-48' }: { className?: string }) {
  return <div className={cn('rounded-md bg-muted animate-pulse', className)} />;
}

export function EmptyReportState({ children }: { children: ReactNode }) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
