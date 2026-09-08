/**
 * Fila tal como la devuelve sp_get_birthday_notifications a traves de la
 * edge function get-birthday-notifications. El SP ya recorta la ventana
 * de cumpleanos y calcula `days_offset`, asi que el front no vuelve a
 * filtrar: solo renombra a camelCase en el adapter.
 */
export interface BirthdayProfileRaw {
  uid: string;
  name: string | null;
  phone: string | null;
  /** YYYY-MM-DD. */
  birthday_day: string | null;
  /** -2, -1, 0 o 1 dias respecto de hoy. */
  days_offset: number;
}

export interface BirthdayProfilesPage {
  page: number;
  size: number;
  total: number;
}

export interface BirthdayProfilesResponse {
  data: BirthdayProfileRaw[];
  page: BirthdayProfilesPage;
}

export interface BirthdayProfile {
  uid: string;
  name: string;
  phone: string;
  birthdayDay: string;
  daysOffset: number;
}
