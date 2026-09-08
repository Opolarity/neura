import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Respuestas de tickets — documento de consulta para quien envía un ticket o
 * una sugerencia al equipo de OPOLARITY. Es contenido estático, sin lógica:
 * vive en esta vista para que el cliente sepa cómo se revisa, se prioriza, se
 * agenda y se cierra lo que reporta.
 */

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
          {n}
        </span>
        {title}
      </h3>
      <div className="space-y-2 text-sm text-muted-foreground pl-7">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5 list-disc pl-4 marker:text-muted-foreground/50">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      {children}
    </p>
  );
}

const SLA_ROWS: { prioridad: string; respuesta: string; solucion: string }[] = [
  { prioridad: "Urgente", respuesta: "1 hora", solucion: "1 día hábil" },
  { prioridad: "Alta", respuesta: "4 horas", solucion: "3 días hábiles" },
  { prioridad: "Media", respuesta: "1 día hábil", solucion: "10 días hábiles" },
  {
    prioridad: "Baja",
    respuesta: "2 días hábiles",
    solucion: "En cola, se revisa cada mes",
  },
];

const PRIORITY_MATRIX: {
  impacto: string;
  todos: string;
  area: string;
  persona: string;
}[] = [
  {
    impacto: "Te impide trabajar",
    todos: "Urgente",
    area: "Urgente",
    persona: "Alta",
  },
  {
    impacto: "Puedes seguir, pero cuesta",
    todos: "Alta",
    area: "Media",
    persona: "Media",
  },
  {
    impacto: "Molesta, hay cómo evitarlo",
    todos: "Media",
    area: "Baja",
    persona: "Baja",
  },
];

const AREAS: { area: string; casos: string }[] = [
  {
    area: "Atención al cliente",
    casos:
      "Dudas de uso, capacitación, datos cargados por error, reclamos comerciales, consultas sobre el estado de un pedido.",
  },
  {
    area: "Tecnología",
    casos:
      "El sistema hace algo distinto de lo esperado, errores en pantalla, información mal calculada, lentitud o una integración caída.",
  },
  {
    area: "Producto",
    casos:
      "La función no existe todavía y hay que decidir si se construye; cambios de alcance, de plazos o de prioridades.",
  },
  {
    area: "Infraestructura",
    casos:
      "El sistema no carga para nadie, problemas de correo, de copias de seguridad o del servidor.",
  },
  {
    area: "Administración de datos",
    casos:
      "Correcciones masivas de información, cargas grandes y ajustes contables.",
  },
];

interface TicketResponseProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketResponseProtocolDialog = ({
  open,
  onOpenChange,
}: TicketResponseProtocolDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Respuestas de tickets</DialogTitle>
          <DialogDescription>
            Cómo revisamos, priorizamos, atendemos y cerramos cada ticket o
            sugerencia que nos envías.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 pt-2">
          <Section n={1} title="Qué pasa apenas envías un ticket">
            <p>
              Tu ticket entra como{" "}
              <span className="font-medium text-foreground">Pendiente</span> y
              se revisa en este orden:
            </p>
            <List
              items={[
                <>
                  <span className="font-medium text-foreground">
                    ¿Se entiende?
                  </span>{" "}
                  Si falta información, te la pedimos toda junta en un solo
                  mensaje.
                </>,
                <>
                  <span className="font-medium text-foreground">
                    ¿Es algo real y justificado?
                  </span>{" "}
                  Si no, se rechaza y te explicamos el motivo.
                </>,
                <>
                  <span className="font-medium text-foreground">
                    ¿Ya lo habías enviado?
                  </span>{" "}
                  Si es repetido, se cierra apuntando al ticket original y
                  quedas avisado del avance de ese.
                </>,
                <>
                  <span className="font-medium text-foreground">
                    ¿Es trabajo o es atención?
                  </span>{" "}
                  Aquí se decide si se convierte en tarea o se te resuelve en la
                  misma conversación.
                </>,
              ]}
            />
          </Section>

          <Section n={2} title="Cuándo tu ticket se convierte en tarea">
            <p>Se agenda como tarea solo si cumple las tres condiciones:</p>
            <List
              items={[
                "Requiere un cambio en el sistema, en la información o en un proceso.",
                "Se puede escribir con claridad cómo sabremos que quedó resuelto.",
                "Se sabe a qué módulo y a qué entorno afecta.",
              ]}
            />
            <p className="pt-1">
              Se te resuelve en la conversación y se cierra, sin generar tarea,
              cuando:
            </p>
            <List
              items={[
                "Es una duda de uso: se responde y se comparte la guía.",
                "Fue un dato mal cargado: se corrige y se explica cómo evitarlo.",
                "Es un permiso o un acceso: se gestiona directamente.",
                "Está fuera de lo contratado: se responde con una cotización.",
              ]}
            />
            <p className="pt-1">
              Un mismo ticket puede generar varias tareas si mezcla temas
              distintos. Lo que nunca hacemos es juntar dos tickets tuyos en una
              sola tarea sin dejar registro de ambos.
            </p>
          </Section>

          <Section n={3} title="Cómo se define la prioridad">
            <p>
              La prioridad no depende de quién insista más, sino de cuánto frena
              el trabajo y a cuánta gente afecta.
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium text-foreground">
                      Qué tan grave es
                    </th>
                    <th className="px-3 py-2 font-medium text-foreground">
                      A todos
                    </th>
                    <th className="px-3 py-2 font-medium text-foreground">
                      A un área
                    </th>
                    <th className="px-3 py-2 font-medium text-foreground">
                      A una persona
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRIORITY_MATRIX.map((row) => (
                    <tr key={row.impacto} className="border-t">
                      <td className="px-3 py-2 text-foreground">
                        {row.impacto}
                      </td>
                      <td className="px-3 py-2">{row.todos}</td>
                      <td className="px-3 py-2">{row.area}</td>
                      <td className="px-3 py-2">{row.persona}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pt-1">
              Tu ticket pasa a{" "}
              <span className="font-medium text-foreground">Urgente</span> de
              forma automática, sin importar la tabla, cuando hay:
            </p>
            <List
              items={[
                "Riesgo legal o tributario.",
                "Pérdida o exposición de información.",
                "Imposibilidad de cobrar o de facturar.",
              ]}
            />
          </Section>

          <Section n={4} title="Tiempos de respuesta y de solución">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium text-foreground">
                      Prioridad
                    </th>
                    <th className="px-3 py-2 font-medium text-foreground">
                      Primera respuesta
                    </th>
                    <th className="px-3 py-2 font-medium text-foreground">
                      Solución
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SLA_ROWS.map((row) => (
                    <tr key={row.prioridad} className="border-t">
                      <td className="px-3 py-2 text-foreground">
                        {row.prioridad}
                      </td>
                      <td className="px-3 py-2">{row.respuesta}</td>
                      <td className="px-3 py-2">{row.solucion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pt-1">
              La{" "}
              <span className="font-medium text-foreground">
                fecha de finalización
              </span>{" "}
              que te comprometemos se calcula como: fecha en que se aprueba +
              tiempo de solución según la prioridad + una holgura según el tipo
              de trabajo.
            </p>
            <List
              items={[
                "Un error en producción no lleva holgura: el plazo es firme.",
                "Una mejora o una función nueva puede llevar más plazo si al analizarla toma más de dos días de trabajo.",
                "Si tienes una fecha externa que cumplir (una campaña, una auditoría), esa manda. Si no es alcanzable, te lo decimos antes de aprobar el ticket, nunca después.",
                "No te comprometemos una fecha antes de analizar cómo se resuelve; hasta entonces solo se compromete la fecha del análisis.",
              ]}
            />
          </Section>

          <Section n={5} title="Cuándo se rechaza un ticket">
            <p>
              Siempre con un motivo escrito y explicado. Los motivos posibles
              son:
            </p>
            <List
              items={[
                "Ya existe otro ticket igual.",
                "No se pudo reproducir el problema después de pedirte información dos veces.",
                "El sistema funciona como fue diseñado: se te explica el comportamiento esperado.",
                "Está fuera de lo contratado.",
                "No es viable técnicamente, o el costo es desproporcionado frente al beneficio.",
                "No llegó la información necesaria dentro del plazo.",
                "Implica un riesgo inaceptable de seguridad, de integridad de la información o de cumplimiento.",
              ]}
            />
            <Note>
              Nunca se rechaza un ticket por falta de tiempo. En ese caso queda
              con prioridad baja y en cola, no rechazado.
            </Note>
          </Section>

          <Section n={6} title="Qué información te vamos a pedir">
            <p>
              Si algo no queda claro, te preguntamos todo de una vez, numerado.
              Nada de preguntas a cuentagotas.
            </p>
            <p className="font-medium text-foreground pt-1">
              Si reportas un problema:
            </p>
            <List
              items={[
                "¿Qué esperabas que pasara y qué pasó en realidad?",
                "¿En qué pantalla y con qué usuario?",
                "¿Qué día y hora, y qué pasos hay que seguir para repetirlo?",
                "¿Le pasa a todos o solo a ti? ¿Desde cuándo?",
                "Captura de pantalla, mensaje de error o el número del documento afectado.",
              ]}
            />
            <p className="font-medium text-foreground pt-1">
              Si propones una mejora:
            </p>
            <List
              items={[
                "¿Qué problema del día a día resuelve? ¿Cómo lo haces hoy sin eso?",
                "¿Quién lo usaría y con qué frecuencia?",
                "¿Cómo sabrías que quedó bien resuelto?",
                "¿Hay una fecha límite real y por qué?",
                "¿Qué pasa si no se hace?",
              ]}
            />
            <p className="pt-1">
              Mientras esperamos tu respuesta, el ticket queda en espera de
              información: a los 3 días hábiles te recordamos, y a los 7 días
              hábiles se cierra por falta de información. Ese cierre siempre lo
              puedes reabrir.
            </p>
          </Section>

          <Section n={7} title="Quién atiende cada cosa">
            <p>
              Tu caso se dirige según su causa, no según quién lo reportó. No
              necesitas saber a qué área mandarlo: eso lo hacemos nosotros.
            </p>
            <div className="space-y-2">
              {AREAS.map((a) => (
                <div key={a.area} className="rounded-md border px-3 py-2">
                  <p className="text-xs font-medium text-foreground">
                    {a.area}
                  </p>
                  <p className="text-xs mt-0.5">{a.casos}</p>
                </div>
              ))}
            </div>
            <List
              items={[
                "Todo ticket entra por atención al cliente, que es quien lo deriva al área que corresponde.",
                "Un caso urgente no se retiene por falta de evidencia: se deriva igual mientras se sigue investigando.",
                "Si resulta que no es un error del sistema, te llega igual la explicación de qué está pasando y qué hacer.",
                "Tu ticket tiene un único responsable en cada momento, así que siempre hay alguien a cargo.",
              ]}
            />
          </Section>

          <Section n={8} title="Compromisos que no se negocian">
            <List
              items={[
                "Ningún ticket se queda sin primera respuesta más allá del tiempo comprometido según su prioridad.",
                "Ningún ticket pasa más de 5 días hábiles sin movimiento: se responde, se reprioriza o se rechaza. El silencio no es una opción.",
                'Todo ticket termina en un estado final: aprobado con su tarea, o rechazado con su motivo. Nada queda "por ahí".',
                "Cuando el trabajo llega a producción, te comentamos el resultado en el ticket y recién ahí se cierra.",
                "El estado se cambia en el momento en que ocurre el hecho, no al final del día. Lo que ves en esta pantalla es la fuente de verdad; lo conversado por chat no cuenta.",
                "Todo rechazo lleva motivo y explicación en lenguaje claro.",
                "Toda aprobación genera una tarea con tipo, módulo, entorno, prioridad y fecha de finalización.",
                "La prioridad y la fecha las define quien coordina, no quien reporta. Si no estás de acuerdo, se escala a la dirección.",
                "Un ticket cerrado no se reabre: se crea uno nuevo que hace referencia al anterior. La excepción es el cierre por falta de información, que sí se reabre.",
                "Recibes aviso en tres momentos: cuando se aprueba, cuando se rechaza y cuando se cierra.",
                "Los urgentes no se acumulan: si hay más de tres abiertos a la vez, se congela el ingreso de funciones nuevas hasta bajar de tres.",
              ]}
            />
          </Section>

          <Section n={9} title="Cómo medimos que esto se cumple">
            <p>Cada semana se revisa:</p>
            <List
              items={[
                "Cuánto tardamos en responder y en resolver, por prioridad, y qué porcentaje quedó dentro del plazo comprometido.",
                "Cuál es el ticket pendiente más antiguo.",
                "Qué porcentaje se convirtió en tarea, se rechazó o resultó repetido.",
                "Cuántos se reabrieron y cuántos rebotaron entre áreas, señal de que se derivaron mal o se describieron mal.",
              ]}
            />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
