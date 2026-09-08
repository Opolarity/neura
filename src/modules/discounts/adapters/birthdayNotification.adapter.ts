import { BirthdayProfile, BirthdayProfileRaw } from '../types/birthdayNotification.types';

/**
 * Renombra a camelCase lo que devuelve el SP. El calculo de la ventana de
 * cumpleanos vivia aqui; se movio a SQL para poder paginar (si no, el
 * paginador contaria perfiles leidos y no cumpleanos) y para dejar de
 * depender de las 1000 filas que como mucho devolvia PostgREST.
 */
export const birthdayNotificationAdapter = (
  raw: BirthdayProfileRaw[],
): BirthdayProfile[] =>
  raw.map((item) => ({
    uid: item.uid,
    name: item.name ?? 'Sin nombre',
    phone: String(item.phone ?? ''),
    birthdayDay: item.birthday_day ?? '',
    daysOffset: item.days_offset,
  }));
