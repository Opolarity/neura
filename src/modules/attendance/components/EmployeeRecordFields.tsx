import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmployeeRecordState } from "../hooks/useEmployeeRecord";
import { CLOCK_SYNC_LABELS, CLOCK_SYNC_VARIANTS, PAY_TYPE_LABELS, PayType } from "../types/attendance.types";
import { formatMinutes } from "../utils/format";

interface EmployeeRecordFieldsProps {
  state: EmployeeRecordState;
  /** Prefijo de los id de los campos (dos formularios en la misma pantalla). */
  idPrefix: string;
}

const SIN_HORARIO = "none";
/** A un operario se le paga por destajo o por hora (módulo de producción). */
const PAGOS_OPERARIO: PayType[] = ["PIECE", "HOURLY"];

/**
 * Campos de "Asistencia y pago": pago, horario, si marca asistencia y PIN del
 * kiosco (opcional: quien no tiene marca con DNI y foto). Operario: elige Destajo o Por hora (la tarifa es su "Costo por
 * hora"). Colaborador: Sueldo, fijo, con su sueldo mensual; su cuadre de horas
 * del mes sale de sus marcas. Si marca asistencia, se eligen los puntos donde
 * puede marcar; sin ninguno queda "Sin punto" y marca desde cualquier lugar,
 * guardando su ubicación. Si la empresa tiene relojes de huella, se eligen en
 * cuáles se le carga (con su PIN como clave del reloj). Los usan los
 * formularios de Operarios y de Usuarios, que los guardan junto con el resto.
 */
export const EmployeeRecordFields = ({ state, idPrefix }: EmployeeRecordFieldsProps) => {
  const { value, setValue, record, kind } = state;
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={id("pay")} required>
            Pago
          </Label>
          {kind === "OPE" ? (
            <Select value={value.payType} onValueChange={(v) => setValue({ payType: v as PayType })}>
              <SelectTrigger id={id("pay")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGOS_OPERARIO.map((k) => (
                  <SelectItem key={k} value={k}>
                    {PAY_TYPE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input id={id("pay")} value={PAY_TYPE_LABELS.SALARY} disabled />
          )}
        </div>
        {kind === "OPE" ? (
          <div className="space-y-1.5">
            <Label htmlFor={id("schedule")}>Horario</Label>
            <ScheduleSelect id={id("schedule")} state={state} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={id("salary")}>Sueldo mensual (S/)</Label>
            <Input
              id={id("salary")}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={value.monthlySalary}
              onChange={(e) => setValue({ monthlySalary: e.target.value })}
            />
          </div>
        )}
      </div>

      {kind !== "OPE" && (
        <div className="space-y-1.5">
          <Label htmlFor={id("schedule")}>Horario</Label>
          <ScheduleSelect id={id("schedule")} state={state} />
        </div>
      )}

      <div className="flex h-10 items-center justify-between rounded-md border px-3">
        <Label htmlFor={id("tracks")}>Marca asistencia</Label>
        <Switch
          id={id("tracks")}
          checked={value.tracksAttendance}
          onCheckedChange={(v) => setValue({ tracksAttendance: v })}
        />
      </div>

      {state.restBalance && (state.restBalance.earnedMinutes > 0 || state.restBalance.takenMinutes > 0) && (
        <p className="rounded-md border bg-muted px-3 py-2 text-sm">
          Bolsa de horas: le quedan <span className="font-semibold">{formatMinutes(state.restBalance.balanceMinutes)}</span>
          <span className="text-muted-foreground">
            {" "}
            (ganó {formatMinutes(state.restBalance.earnedMinutes)}, tomó {formatMinutes(state.restBalance.takenMinutes)})
          </span>
        </p>
      )}

      {value.tracksAttendance && (
        <div className="space-y-1.5">
          <Label htmlFor={id("points")}>Puntos de marcación</Label>
          <PointsSelect id={id("points")} state={state} />
          {value.pointIds.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin punto: marca desde cualquier lugar y se guarda su ubicación.</p>
          )}
        </div>
      )}

      {value.tracksAttendance && (state.clocks.length > 0 || value.deviceIds.length > 0) && (
        <div className="space-y-1.5">
          <Label htmlFor={id("clocks")}>Relojes de huella</Label>
          <ClocksSelect id={id("clocks")} state={state} />
          <ClocksStatus state={state} />
        </div>
      )}

      {value.tracksAttendance && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={id("pin")}>
              {record?.hasPin && !value.removePin ? "Nuevo PIN (vacío = no cambia)" : "PIN para el kiosco (opcional)"}
            </Label>
            {record?.hasPin && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setValue({ removePin: !value.removePin, pin: "" })}
              >
                {value.removePin ? "Mantener PIN" : "Quitar PIN"}
              </Button>
            )}
          </div>
          <Input
            id={id("pin")}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            placeholder="4 a 6 números"
            disabled={value.removePin}
            value={value.pin}
            onChange={(e) => setValue({ pin: e.target.value.replace(/\D/g, "") })}
          />
          <p className="text-xs text-muted-foreground">
            {value.removePin
              ? "Al guardar se quita el PIN: marcará en el kiosco con su DNI y la foto."
              : "Con PIN, el kiosco se lo pide al marcar; sin PIN, marca con su DNI y la foto."}
            {value.deviceIds.length > 0 && " En el reloj, el PIN es su clave cuando la huella no lo reconoce."}
          </p>
        </div>
      )}
    </div>
  );
};

const ScheduleSelect = ({ id, state }: { id: string; state: EmployeeRecordState }) => {
  const { value, setValue, schedules } = state;
  return (
    <Select
      value={value.scheduleId ? String(value.scheduleId) : SIN_HORARIO}
      onValueChange={(v) => setValue({ scheduleId: v === SIN_HORARIO ? null : Number(v) })}
    >
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SIN_HORARIO}>Sin horario (horas reales)</SelectItem>
        {schedules
          .filter((s) => s.isActive || s.id === value.scheduleId)
          .map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

/** Selector múltiple de puntos de marcación (ninguno = sin punto). */
const PointsSelect = ({ id, state }: { id: string; state: EmployeeRecordState }) => {
  const { value, setValue, points } = state;
  const opciones = points.filter((p) => p.isActive || value.pointIds.includes(p.id));
  const elegidos = opciones.filter((p) => value.pointIds.includes(p.id));
  const toggle = (pointId: number) =>
    setValue({
      pointIds: value.pointIds.includes(pointId)
        ? value.pointIds.filter((x) => x !== pointId)
        : [...value.pointIds, pointId],
    });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate">
            {elegidos.length === 0
              ? "Sin punto"
              : elegidos.length <= 2
                ? elegidos.map((p) => p.name).join(", ")
                : `${elegidos.length} puntos`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandEmpty>No hay puntos de marcación.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {opciones.map((p) => (
              <CommandItem key={p.id} onSelect={() => toggle(p.id)} className="cursor-pointer">
                <Checkbox checked={value.pointIds.includes(p.id)} className="mr-2" />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/** Selector múltiple de relojes de huella donde se le carga. */
const ClocksSelect = ({ id, state }: { id: string; state: EmployeeRecordState }) => {
  const { value, setValue, clocks } = state;
  const elegidos = clocks.filter((c) => value.deviceIds.includes(c.id));
  const toggle = (deviceId: number) =>
    setValue({
      deviceIds: value.deviceIds.includes(deviceId)
        ? value.deviceIds.filter((x) => x !== deviceId)
        : [...value.deviceIds, deviceId],
    });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate">
            {elegidos.length === 0
              ? "En ningún reloj"
              : elegidos.length <= 2
                ? elegidos.map((c) => c.name).join(", ")
                : `${elegidos.length} relojes`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandEmpty>No hay relojes registrados.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {clocks.map((c) => (
              <CommandItem key={c.id} onSelect={() => toggle(c.id)} className="cursor-pointer">
                <Checkbox checked={value.deviceIds.includes(c.id)} className="mr-2" />
                <div>
                  <div>{c.name}</div>
                  {c.pointName && <div className="text-xs text-muted-foreground">{c.pointName}</div>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/** Estado en cada reloj guardado, su número de usuario y si ya tiene huella. */
const ClocksStatus = ({ state }: { state: EmployeeRecordState }) => {
  const { record, clocks, value } = state;
  const estados = record?.devices ?? [];
  const nombre = (deviceId: number) => clocks.find((c) => c.id === deviceId)?.name ?? `Reloj ${deviceId}`;

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {estados.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {estados.map((e) => (
            <Badge key={e.deviceId} variant={CLOCK_SYNC_VARIANTS[e.syncStatus]} title={e.syncError ?? undefined}>
              {nombre(e.deviceId)}: {CLOCK_SYNC_LABELS[e.syncStatus]}
            </Badge>
          ))}
        </div>
      )}
      {(record?.clockUserId || value.deviceIds.length > 0) && (
        <p>
          {record?.clockUserId
            ? `Número en el reloj: ${record.clockUserId}. `
            : "Al guardar se le asigna su número en el reloj (su DNI). "}
          {record?.hasFingerprint
            ? "Huella registrada: se carga sola en sus otros relojes."
            : "Registra su huella en el reloj después de guardar."}
          {record?.hasPin && !record.hasClockPassword && !value.pin && " Vuelve a poner su PIN para que sirva de clave en el reloj."}
        </p>
      )}
    </div>
  );
};
