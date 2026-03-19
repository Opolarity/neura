export interface BirthdayProfileRaw {
  UID: string;
  phone: number | null;
  birthday_day: string | null;
  account_id: number | null;
  accounts: {
    name: string | null;
  } | null;
}

export interface BirthdayProfile {
  uid: string;
  name: string;
  phone: string;
  birthdayDay: string;
  daysOffset: number;
}
