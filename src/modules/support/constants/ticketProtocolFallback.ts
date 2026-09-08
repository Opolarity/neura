/**
 * Copia de respaldo del protocolo de respuestas de tickets.
 *
 * El texto vivo lo edita OPOLARITY y llega por `get-support-protocol`. Esta
 * constante es lo que se muestra cuando esa llamada no se puede hacer: sin
 * red, sin la API key configurada, con OPOLARITY caído o en el primer arranque
 * del navegador. Es un documento de consulta: preferimos una version de hace
 * unos meses antes que un modal vacio.
 *
 * OJO: esta copia NO se actualiza sola. Va a quedarse vieja respecto de lo que
 * se edita en OPOLARITY, y esta bien que asi sea — no la "corrijas" pensando
 * que es el texto real. El texto real es el de la base de Tasks.
 *
 * Sale de docs/contenido/protocolo-respuestas-tickets.html del repo de Tasks
 * (misma fuente que la semilla de la migracion 095).
 */
export const TICKET_PROTOCOL_FALLBACK = {
  title: "Respuestas de tickets",
  subtitle:
    "Cómo revisamos, priorizamos, atendemos y cerramos cada ticket o sugerencia que nos envías.",
  version: 1,
  html: `<h3>1. Qué pasa apenas envías un ticket</h3>
<p>Tu ticket entra como <strong>Pendiente</strong> y se revisa en este orden:</p>
<ul>
  <li><strong>¿Se entiende?</strong> Si falta información, te la pedimos toda junta en un solo mensaje.</li>
  <li><strong>¿Es algo real y justificado?</strong> Si no, se rechaza y te explicamos el motivo.</li>
  <li><strong>¿Ya lo habías enviado?</strong> Si es repetido, se cierra apuntando al ticket original y quedas avisado del avance de ese.</li>
  <li><strong>¿Es trabajo o es atención?</strong> Aquí se decide si se convierte en tarea o se te resuelve en la misma conversación.</li>
</ul>

<h3>2. Cuándo tu ticket se convierte en tarea</h3>
<p>Se agenda como tarea solo si cumple las tres condiciones:</p>
<ul>
  <li>Requiere un cambio en el sistema, en la información o en un proceso.</li>
  <li>Se puede escribir con claridad cómo sabremos que quedó resuelto.</li>
  <li>Se sabe a qué módulo y a qué entorno afecta.</li>
</ul>
<p>Se te resuelve en la conversación y se cierra, sin generar tarea, cuando:</p>
<ul>
  <li>Es una duda de uso: se responde y se comparte la guía.</li>
  <li>Fue un dato mal cargado: se corrige y se explica cómo evitarlo.</li>
  <li>Es un permiso o un acceso: se gestiona directamente.</li>
  <li>Está fuera de lo contratado: se responde con una cotización.</li>
</ul>
<p>Un mismo ticket puede generar varias tareas si mezcla temas distintos. Lo que nunca hacemos es juntar dos tickets tuyos en una sola tarea sin dejar registro de ambos.</p>

<h3>3. Cómo se define la prioridad</h3>
<p>La prioridad no depende de quién insista más, sino de cuánto frena el trabajo y a cuánta gente afecta.</p>
<table>
  <thead>
    <tr>
      <th>Qué tan grave es</th>
      <th>A todos</th>
      <th>A un área</th>
      <th>A una persona</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Te impide trabajar</td><td>Urgente</td><td>Urgente</td><td>Alta</td></tr>
    <tr><td>Puedes seguir, pero cuesta</td><td>Alta</td><td>Media</td><td>Media</td></tr>
    <tr><td>Molesta, hay cómo evitarlo</td><td>Media</td><td>Baja</td><td>Baja</td></tr>
  </tbody>
</table>
<p>Tu ticket pasa a <strong>Urgente</strong> de forma automática, sin importar la tabla, cuando hay:</p>
<ul>
  <li>Riesgo legal o tributario.</li>
  <li>Pérdida o exposición de información.</li>
  <li>Imposibilidad de cobrar o de facturar.</li>
</ul>

<h3>4. Tiempos de respuesta y de solución</h3>
<table>
  <thead>
    <tr>
      <th>Prioridad</th>
      <th>Primera respuesta</th>
      <th>Solución</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Urgente</td><td>1 hora</td><td>1 día hábil</td></tr>
    <tr><td>Alta</td><td>4 horas</td><td>3 días hábiles</td></tr>
    <tr><td>Media</td><td>1 día hábil</td><td>10 días hábiles</td></tr>
    <tr><td>Baja</td><td>2 días hábiles</td><td>En cola, se revisa cada mes</td></tr>
  </tbody>
</table>
<p>La <strong>fecha de finalización</strong> que te comprometemos se calcula como: fecha en que se aprueba + tiempo de solución según la prioridad + una holgura según el tipo de trabajo.</p>
<ul>
  <li>Un error en producción no lleva holgura: el plazo es firme.</li>
  <li>Una mejora o una función nueva puede llevar más plazo si al analizarla toma más de dos días de trabajo.</li>
  <li>Si tienes una fecha externa que cumplir (una campaña, una auditoría), esa manda. Si no es alcanzable, te lo decimos antes de aprobar el ticket, nunca después.</li>
  <li>No te comprometemos una fecha antes de analizar cómo se resuelve; hasta entonces solo se compromete la fecha del análisis.</li>
</ul>

<h3>5. Cuándo se rechaza un ticket</h3>
<p>Siempre con un motivo escrito y explicado. Los motivos posibles son:</p>
<ul>
  <li>Ya existe otro ticket igual.</li>
  <li>No se pudo reproducir el problema después de pedirte información dos veces.</li>
  <li>El sistema funciona como fue diseñado: se te explica el comportamiento esperado.</li>
  <li>Está fuera de lo contratado.</li>
  <li>No es viable técnicamente, o el costo es desproporcionado frente al beneficio.</li>
  <li>No llegó la información necesaria dentro del plazo.</li>
  <li>Implica un riesgo inaceptable de seguridad, de integridad de la información o de cumplimiento.</li>
</ul>
<blockquote>Nunca se rechaza un ticket por falta de tiempo. En ese caso queda con prioridad baja y en cola, no rechazado.</blockquote>

<h3>6. Qué información te vamos a pedir</h3>
<p>Si algo no queda claro, te preguntamos todo de una vez, numerado. Nada de preguntas a cuentagotas.</p>
<p><strong>Si reportas un problema:</strong></p>
<ul>
  <li>¿Qué esperabas que pasara y qué pasó en realidad?</li>
  <li>¿En qué pantalla y con qué usuario?</li>
  <li>¿Qué día y hora, y qué pasos hay que seguir para repetirlo?</li>
  <li>¿Le pasa a todos o solo a ti? ¿Desde cuándo?</li>
  <li>Captura de pantalla, mensaje de error o el número del documento afectado.</li>
</ul>
<p><strong>Si propones una mejora:</strong></p>
<ul>
  <li>¿Qué problema del día a día resuelve? ¿Cómo lo haces hoy sin eso?</li>
  <li>¿Quién lo usaría y con qué frecuencia?</li>
  <li>¿Cómo sabrías que quedó bien resuelto?</li>
  <li>¿Hay una fecha límite real y por qué?</li>
  <li>¿Qué pasa si no se hace?</li>
</ul>
<p>Mientras esperamos tu respuesta, el ticket queda en espera de información: a los 3 días hábiles te recordamos, y a los 7 días hábiles se cierra por falta de información. Ese cierre siempre lo puedes reabrir.</p>

<h3>7. Quién atiende cada cosa</h3>
<p>Tu caso se dirige según su causa, no según quién lo reportó. No necesitas saber a qué área mandarlo: eso lo hacemos nosotros.</p>
<ul>
  <li><strong>Atención al cliente.</strong> Dudas de uso, capacitación, datos cargados por error, reclamos comerciales, consultas sobre el estado de un pedido.</li>
  <li><strong>Tecnología.</strong> El sistema hace algo distinto de lo esperado, errores en pantalla, información mal calculada, lentitud o una integración caída.</li>
  <li><strong>Producto.</strong> La función no existe todavía y hay que decidir si se construye; cambios de alcance, de plazos o de prioridades.</li>
  <li><strong>Infraestructura.</strong> El sistema no carga para nadie, problemas de correo, de copias de seguridad o del servidor.</li>
  <li><strong>Administración de datos.</strong> Correcciones masivas de información, cargas grandes y ajustes contables.</li>
</ul>
<ul>
  <li>Todo ticket entra por atención al cliente, que es quien lo deriva al área que corresponde.</li>
  <li>Un caso urgente no se retiene por falta de evidencia: se deriva igual mientras se sigue investigando.</li>
  <li>Si resulta que no es un error del sistema, te llega igual la explicación de qué está pasando y qué hacer.</li>
  <li>Tu ticket tiene un único responsable en cada momento, así que siempre hay alguien a cargo.</li>
</ul>

<h3>8. Compromisos que no se negocian</h3>
<ul>
  <li>Ningún ticket se queda sin primera respuesta más allá del tiempo comprometido según su prioridad.</li>
  <li>Ningún ticket pasa más de 5 días hábiles sin movimiento: se responde, se reprioriza o se rechaza. El silencio no es una opción.</li>
  <li>Todo ticket termina en un estado final: aprobado con su tarea, o rechazado con su motivo. Nada queda "por ahí".</li>
  <li>Cuando el trabajo llega a producción, te comentamos el resultado en el ticket y recién ahí se cierra.</li>
  <li>El estado se cambia en el momento en que ocurre el hecho, no al final del día. Lo que ves en esta pantalla es la fuente de verdad; lo conversado por chat no cuenta.</li>
  <li>Todo rechazo lleva motivo y explicación en lenguaje claro.</li>
  <li>Toda aprobación genera una tarea con tipo, módulo, entorno, prioridad y fecha de finalización.</li>
  <li>La prioridad y la fecha las define quien coordina, no quien reporta. Si no estás de acuerdo, se escala a la dirección.</li>
  <li>Un ticket cerrado no se reabre: se crea uno nuevo que hace referencia al anterior. La excepción es el cierre por falta de información, que sí se reabre.</li>
  <li>Recibes aviso en tres momentos: cuando se aprueba, cuando se rechaza y cuando se cierra.</li>
  <li>Los urgentes no se acumulan: si hay más de tres abiertos a la vez, se congela el ingreso de funciones nuevas hasta bajar de tres.</li>
</ul>

<h3>9. Cómo medimos que esto se cumple</h3>
<p>Cada semana se revisa:</p>
<ul>
  <li>Cuánto tardamos en responder y en resolver, por prioridad, y qué porcentaje quedó dentro del plazo comprometido.</li>
  <li>Cuál es el ticket pendiente más antiguo.</li>
  <li>Qué porcentaje se convirtió en tarea, se rechazó o resultó repetido.</li>
  <li>Cuántos se reabrieron y cuántos rebotaron entre áreas, señal de que se derivaron mal o se describieron mal.</li>
</ul>`,
} as const;
