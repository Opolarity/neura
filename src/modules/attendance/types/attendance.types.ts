/**
 * Tipo de pago (types): PIECE Destajo y HOURLY Por hora (operarios, módulo
 * OPR) o SALARY Sueldo (colaboradores, módulo ASI).
 */
export type PayType = "PIECE" | "HOURLY" | "SALARY";
/** OPE = operario, COL = colaborador (account_types). */
export type EmployeeKind = "OPE" | "COL";
export type PunchType = "IN" | "OUT";
export type PunchMethod = "PIN" | "QR" | "DNI" | "LOGIN" | "SUPERVISOR" | "FINGERPRINT";
export interface Punch {
  id: number;
  employeeId: number;
  code: string;
  name: string;
  documentNumber: string | null;
  punchedAt: string;
  punchType: PunchType;
  method: PunchMethod;
  pointId: number | null;
  pointName: string | null;
  photoPath: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  note: string | null;
  createdBy: string | null;
}

export interface PunchFilters {
  /** null/null = sin filtro de fechas: las marcas más recientes. */
  dateFrom: string | null;
  dateTo: string | null;
  /** Nombre, código o DNI. */
  search: string;
  pointId: number | null;
}

export interface PunchPayload {
  id: number | null;
  employeeId: number;
  /** "YYYY-MM-DDTHH:mm" en hora de Lima. */
  punchedAt: string;
  punchType: PunchType;
  pointId: number | null;
  note: string | null;
}

/**
 * Un tramo del día: entrada → salida. Cada marca cuenta por su minuto (sin
 * segundos). Entrada sin salida: `out` null; salida sin entrada: `in` null.
 */
export interface TimesheetSegment {
  in: string | null;
  out: string | null;
  /** Minutos del tramo; null si le falta la entrada o la salida. */
  minutes: number | null;
  /** Tarifa por hora del tramo (la de su marca de entrada). */
  rate: number | null;
}

export interface TimesheetDay {
  day: string;
  firstIn: string | null;
  lastOut: string | null;
  /** Todos los tramos del día, en orden. */
  segments: TimesheetSegment[];
  punches: number;
  workedMinutes: number;
  breakMinutes: number;
  scheduledMinutes: number | null;
  lateMinutes: number;
  overtimeMinutes: number;
  isAbsent: boolean;
  isIncomplete: boolean;
  /** Feriado de la empresa: no es falta; lo trabajado va a holidayMinutes. */
  isHoliday: boolean;
  holidayName: string | null;
  holidayMinutes: number;
  /** Feriado trabajado: se paga con el aumento (PAY) o va a la bolsa de horas (REST). */
  compensation: HolidayCompensation | null;
  /** Horas extra de un día normal (solo con horario): se pagan (PAY) o van a la bolsa (BANK). */
  overtimeCompensation: OvertimeCompensation | null;
  /** Descanso tomado ese día (a cuenta de feriados trabajados). */
  restId: number | null;
  restMinutes: number;
  restFullDay: boolean;
  restNote: string | null;
  hourlyRate: number | null;
  amount: number;
}

export type HolidayCompensation = "PAY" | "REST";
export type OvertimeCompensation = "PAY" | "BANK";

export interface TimesheetEmployee {
  employeeId: number;
  code: string;
  name: string;
  kind: EmployeeKind;
  payType: PayType;
  hourlyRate: number | null;
  /** Sueldo mensual (solo los de pago SALARY). */
  monthlySalary: number | null;
  scheduleName: string | null;
  daysWorked: number;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  absences: number;
  incompleteDays: number;
  /** Feriados en que trabajó y sus minutos. */
  holidaysWorked: number;
  holidayMinutes: number;
  /** Quien tiene sueldo: sueldo ÷ 30 ÷ horas de su jornada (lo calcula el servidor). */
  hourValue: number | null;
  /** Quien tiene sueldo: extra por feriado trabajado (horas × valor hora × sobretasa). */
  holidayPay: number | null;
  /** Horas extra por feriado: las de feriados que se pagan con el aumento. */
  holidayExtraMinutes: number;
  /** Descanso ganado en el rango (feriados con descanso), tomado en el rango y saldo de toda su historia. */
  restEarnedMinutes: number;
  restTakenMinutes: number;
  restBalanceMinutes: number;
  /** Horas extra (con horario) que se pagan y las que van a la bolsa. */
  overtimePaidMinutes: number;
  overtimeBankMinutes: number;
  /** Lo que entró a la bolsa en el rango: feriados con descanso + horas extra. */
  bankEarnedMinutes: number;
  amount: number;
  days: TimesheetDay[];
}

/** Saldo de descanso de un trabajador y los descansos que tomó. */
export interface RestBalance {
  earnedMinutes: number;
  takenMinutes: number;
  balanceMinutes: number;
  rests: { id: number; day: string; minutes: number; isFullDay: boolean; note: string | null }[];
}

export interface RestPayload {
  id: number | null;
  employeeId: number;
  day: string;
  fullDay: boolean;
  /** Solo con «unas horas». */
  minutes: number | null;
  note: string | null;
}

export interface Timesheet {
  dateFrom: string;
  dateTo: string;
  employees: TimesheetEmployee[];
}

/** Ficha laboral de una persona (sp_get_attendance_employee). */
export interface EmployeeRecord {
  accountId: number;
  name: string;
  documentNumber: string | null;
  /** Solo colaboradores (COL) y operarios (OPE) tienen ficha. */
  isWorker: boolean;
  kind: EmployeeKind | null;
  hasRecord: boolean;
  code: string | null;
  payType: PayType | null;
  hourlyCost: number | null;
  /** Sueldo mensual de un colaborador (pago SALARY); null = sin declarar. */
  monthlySalary: number | null;
  scheduleId: number | null;
  tracksAttendance: boolean;
  hasPin: boolean;
  /** Puntos donde puede marcar; vacío = sin punto (marca desde cualquier lugar). */
  pointIds: number[];
  /** Relojes de huella donde está (sin los que se están quitando). */
  deviceIds: number[];
  /** Estado en cada reloj, incluidos los que se están quitando. */
  devices: EmployeeDeviceStatus[];
  /** Número de usuario en los relojes (se teclea antes de la huella). */
  clockUserId: string | null;
  /** El reloj ya subió su huella: se carga sola en sus otros relojes. */
  hasFingerprint: boolean;
  /** Su PIN se puede mandar al reloj como clave (los PIN viejos solo están como hash). */
  hasClockPassword: boolean;
}

export type ClockSyncStatus = "PENDING_ADD" | "SYNCED" | "PENDING_DELETE" | "ERROR";

export interface EmployeeDeviceStatus {
  deviceId: number;
  syncStatus: ClockSyncStatus;
  syncError: string | null;
}

/** Lo que se edita en la sección "Asistencia y pago". */
export interface EmployeeRecordValue {
  payType: PayType;
  /** Sueldo mensual tal como se escribe (solo colaboradores); "" = sin declarar. */
  monthlySalary: string;
  scheduleId: number | null;
  tracksAttendance: boolean;
  /** Puntos donde puede marcar; vacío = sin punto (marca desde cualquier lugar). */
  pointIds: number[];
  /** Relojes de huella donde se le carga. */
  deviceIds: number[];
  /** PIN nuevo; vacío = no se cambia. */
  pin: string;
  /** Quitar el PIN que tiene: desde ahí marca en el kiosco con DNI y foto. */
  removePin: boolean;
}

/** Un trabajador para elegir en el formulario de marca. */
export interface EmployeeOption {
  accountId: number;
  code: string | null;
  name: string;
  documentNumber: string | null;
  kind: EmployeeKind;
}

export interface EmployeePayload {
  accountId: number;
  payType: PayType;
  hourlyCost: number | null;
  monthlySalary: number | null;
  scheduleId: number | null;
  tracksAttendance: boolean;
  /** null = no se tocan; [] = sin punto. */
  pointIds: number[] | null;
  /** null = no se tocan; [] = en ningún reloj. */
  deviceIds: number[] | null;
}

export interface ScheduleDay {
  /** 1 = lunes … 7 = domingo. */
  weekday: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface Schedule {
  id: number;
  name: string;
  toleranceMinutes: number;
  isActive: boolean;
  employees: number;
  days: ScheduleDay[];
}

export interface SchedulePayload {
  id: number | null;
  name: string;
  toleranceMinutes: number;
  isActive: boolean;
  days: ScheduleDay[];
}

export interface AttendancePoint {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusM: number | null;
  requirePhoto: boolean;
  isActive: boolean;
  lastUsedAt: string | null;
}

export interface PointPayload {
  id: number | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusM: number | null;
  requirePhoto: boolean;
  isActive: boolean;
}

/** Resultado de una marca (kiosco o autoservicio). */
export interface PunchResult {
  ok: boolean;
  message: string | null;
  duplicate: boolean;
  punchType: PunchType | null;
  punchedAt: string | null;
  employeeName: string | null;
  employeeCode: string | null;
  pointName: string | null;
  /** Doble toque (otra marca en menos de 1 minuto): lo que toca y desde cuándo. */
  nextType: PunchType | null;
  nextAt: string | null;
  /** La persona tiene PIN y no lo mandó (o lo erró): el kiosco se lo pide. */
  pinRequired: boolean;
}

/** El link del kiosco de la empresa (/asistencia/<token>), para compartir. */
export interface KioskLink {
  token: string;
  createdAt: string;
}

/** Una marca de hoy del usuario, en "Marcar mi asistencia". */
export interface MyPunch {
  id: number;
  punchType: PunchType;
  punchedAt: string;
  pointName: string | null;
  /** Sin punto: se muestran sus coordenadas. */
  remote: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
}

/** "Marcar mi asistencia": lo que toca marcar y las marcas de hoy. */
export interface MyAttendanceToday {
  /** false = el usuario no tiene marcación activa (message dice por qué). */
  ok: boolean;
  message: string | null;
  nextType: PunchType;
  /** Doble toque: hasta esta hora no se puede volver a marcar. */
  nextAt: string | null;
  /** Sin puntos asignados ("Sin punto"): marca desde cualquier lugar. */
  remote: boolean;
  points: string[];
  /** Alguno de sus puntos pide foto: recién ahí se muestra la cámara. */
  requirePhoto: boolean;
  punches: MyPunch[];
}

/** El kiosco abierto en este equipo (link único /asistencia). */
export interface KioskInfo {
  deviceName: string;
  tenantName: string | null;
  /** Algún punto exige foto: la cámara se prende. */
  requirePhoto: boolean;
}

export interface KioskActivation {
  deviceId: number;
  deviceSecret: string;
}

export type DeviceKind = "KIOSK" | "CLOCK";

/** Un equipo de marcación: kiosco (tablet/celular) o reloj de huella ZKTeco. */
export interface AttendanceDevice {
  id: number;
  kind: DeviceKind;
  name: string;
  createdAt: string;
  createdBy: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  /** Reloj: número de serie, punto donde está, IP y firmware que reporta. */
  serialNumber: string | null;
  pointId: number | null;
  pointName: string | null;
  lastIp: string | null;
  firmware: string | null;
  /** Reloj: se comunicó en los últimos 3 minutos. */
  online: boolean;
  usersSynced: number;
  usersPending: number;
  usersError: number;
}

export interface ClockPayload {
  id: number | null;
  name: string;
  serial: string;
  pointId: number | null;
}

/** Un trabajador cargado (o por cargar) en un reloj. */
export interface ClockEmployee {
  employeeId: number;
  name: string;
  code: string | null;
  clockUserId: string | null;
  syncStatus: ClockSyncStatus;
  syncError: string | null;
  syncedAt: string | null;
  hasFingerprint: boolean;
  hasPassword: boolean;
}

/** Usuario que el reloj ya tenía y todavía no es de ningún trabajador. */
export interface ClockFoundUser {
  pin: string;
  name: string;
  seenAt: string | null;
}

export interface ClockEvent {
  at: string;
  kind: string;
  pin: string | null;
  time: string | null;
  detail: string | null;
}

export interface ClockDetail {
  id: number;
  name: string;
  serialNumber: string | null;
  online: boolean;
  lastUsedAt: string | null;
  usersQueriedAt: string | null;
  employees: ClockEmployee[];
  found: ClockFoundUser[];
  events: ClockEvent[];
}

export const CLOCK_SYNC_LABELS: Record<ClockSyncStatus, string> = {
  PENDING_ADD: "Por cargar",
  SYNCED: "Cargado",
  PENDING_DELETE: "Por quitar",
  ERROR: "Error",
};

export const CLOCK_SYNC_VARIANTS: Record<ClockSyncStatus, "warning" | "success" | "pending" | "destructive-soft"> = {
  PENDING_ADD: "warning",
  SYNCED: "success",
  PENDING_DELETE: "pending",
  ERROR: "destructive-soft",
};

export const CLOCK_EVENT_LABELS: Record<string, string> = {
  NOT_IN_DEVICE: "Marcó alguien que no está en este reloj",
  UNSUPPORTED_METHOD: "Forma de marcado no soportada (solo huella o clave)",
  FUTURE_TIME: "La hora del reloj está adelantada",
  COMMAND_ERROR: "El reloj rechazó un cambio",
  CLOCK_USER_DELETED: "Se borró en el reloj: se quitó este reloj de su ficha",
  OPLOG: "Cambio hecho en el menú del reloj",
};

/** Códigos de las operaciones del menú del reloj (OPLOG) que se muestran. */
export const CLOCK_OPLOG_LABELS: Record<string, string> = {
  "2": "verificación fallida",
  "3": "alarma",
  "5": "cambio de configuración",
  "6": "registro de huella",
  "7": "registro de clave",
  "8": "registro de tarjeta",
  "9": "borrado de usuario",
  "10": "borrado de huella",
  "11": "borrado de clave",
  "12": "borrado de tarjeta",
  "13": "borrado de datos",
};

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  PIECE: "Destajo",
  HOURLY: "Por hora",
  SALARY: "Sueldo",
};

export const KIND_LABELS: Record<EmployeeKind, string> = {
  OPE: "Operario",
  COL: "Colaborador",
};

export const METHOD_LABELS: Record<PunchMethod, string> = {
  PIN: "Kiosco (DNI + PIN)",
  QR: "Kiosco (fotocheck)",
  DNI: "Kiosco (DNI + foto)",
  LOGIN: "Su usuario",
  SUPERVISOR: "Supervisor",
  FINGERPRINT: "Huella",
};

export const WEEKDAY_LABELS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ------------------------------------------------------- Pago por hora ----

export interface HourlyPayment {
  movementId: number;
  amount: number;
  date: string | null;
  paymentMethod: string | null;
  voucherUrl: string | null;
}

export interface HourlySettlementEmployee {
  employeeId: number;
  code: string;
  name: string;
  payType: PayType;
  hourlyRate: number | null;
  workedMinutes: number;
  /** Ganado en el periodo. */
  amount: number;
  /** Lo que falta pagar de lo ganado en el periodo. */
  pending: number;
  /** Pagado con fecha en el periodo. */
  paid: number;
  totalPending: number;
  credit: number;
  payments: HourlyPayment[];
}

export interface HourlySettlement {
  dateFrom: string;
  dateTo: string;
  employees: HourlySettlementEmployee[];
  totals: { workedMinutes: number; amount: number; paid: number; pending: number; totalPending: number };
}

// ------------------------------------------------------------- Feriados ----

/** Un feriado de la empresa (cada una crea los suyos). */
export interface Holiday {
  id: number;
  /** Día de calendario "YYYY-MM-DD". */
  day: string;
  name: string;
}

export interface HolidayYear {
  year: number;
  holidays: Holiday[];
  /** Cuántos tiene el año anterior (para ofrecer copiarlos). */
  previousYearCount: number;
}

/** Pago en feriado: multiplicador (2 = sobretasa del 100 %) y desde cuándo aplica. */
export interface AttendanceSettings {
  holidayPayMultiplier: number;
  /** null = desde siempre. */
  holidayPayFrom: string | null;
  /** Si alguien trabaja un feriado, por defecto: pagar con el aumento o darle descanso. */
  holidayDefaultCompensation: HolidayCompensation;
  /** Horas extra, por defecto: se pagan o van a la bolsa de horas. */
  overtimeDefaultCompensation: OvertimeCompensation;
}

/** Lo que se guarda en los ajustes; lo que no se manda no se toca. */
export interface AttendanceSettingsPatch {
  holidayPayMultiplier?: number;
  holidayDefaultCompensation?: HolidayCompensation;
  overtimeDefaultCompensation?: OvertimeCompensation;
}
