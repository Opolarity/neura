import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ReportCard({ title, description, actions, children, className, contentClassName }: ReportCardProps) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <Card className={cn('overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          {(title || description) && (
            <div className="min-w-0 space-y-1">
              {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
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
