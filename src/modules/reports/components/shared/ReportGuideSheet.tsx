import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { COMMON_CONCEPTS, type ReportGuide } from '../../guides/reportGuides';

interface Props {
  guide: ReportGuide;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
  );
}

/**
 * Botón "Entender este reporte" + panel lateral con la explicación de la
 * pestaña: qué mide, qué es cada tarjeta y de dónde sale, qué muestra cada
 * gráfico, qué trae el Excel y cómo validar los números. El contenido vive en
 * guides/reportGuides.ts; acá solo se maqueta.
 */
export function ReportGuideSheet({ guide }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Entender este reporte
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Reporte de {guide.name}
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">{guide.summary}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* Reglas para leer la pestaña */}
          {guide.rules.length > 0 && (
            <ul className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              {guide.rules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Tarjetas */}
          <section>
            <SectionTitle>Tarjetas</SectionTitle>
            <div className="divide-y rounded-md border">
              {guide.cards.map((card) => (
                <div key={card.title} className="px-4 py-3">
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-0.5 text-sm text-foreground/90">{card.what}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Fuente:</span> {card.source}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Gráficos y tablas */}
          <section>
            <SectionTitle>Gráficos y tablas</SectionTitle>
            <dl className="space-y-3">
              {guide.charts.map((chart) => (
                <div key={chart.title}>
                  <dt className="text-sm font-semibold">{chart.title}</dt>
                  <dd className="mt-0.5 text-sm text-foreground/90">{chart.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Excel */}
          <section>
            <SectionTitle>Qué trae el Excel</SectionTitle>
            <p className="text-sm text-foreground/90">{guide.excel}</p>
          </section>

          {/* Cómo validar */}
          <section className="rounded-md border border-success/30 bg-success/5 px-4 py-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              Cómo validar estos números
            </h3>
            <ol className="space-y-2.5 text-sm">
              {guide.validation.map((v, i) => (
                <li key={v.check} className="flex gap-2.5">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span>
                    <span className="font-semibold">{v.check}:</span> {v.how}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* Conceptos comunes a todas las pestañas */}
          <section>
            <SectionTitle>Conceptos que aplican a todos los reportes</SectionTitle>
            <Accordion type="single" collapsible className="rounded-md border px-3">
              {COMMON_CONCEPTS.map((c, i) => (
                <AccordionItem key={c.title} value={`c-${i}`} className={i === COMMON_CONCEPTS.length - 1 ? 'border-b-0' : ''}>
                  <AccordionTrigger className="py-2.5 text-left text-sm hover:no-underline">{c.title}</AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/90">{c.text}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
