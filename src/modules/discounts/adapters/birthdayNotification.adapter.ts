import { BirthdayProfile, BirthdayProfileRaw } from '../types/birthdayNotification.types';

function getBirthdayRange(): Array<{ month: number; day: number; offset: number }> {
  const today = new Date();
  return [-2, -1, 0, 1].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return { month: d.getMonth() + 1, day: d.getDate(), offset };
  });
}

export const birthdayNotificationAdapter = (
  raw: BirthdayProfileRaw[]
): BirthdayProfile[] => {
  const range = getBirthdayRange();

  return raw.reduce<BirthdayProfile[]>((acc, item) => {
    if (!item.birthday_day || !item.phone) return acc;

    const parts = item.birthday_day.split('-').map(Number);
    const month = parts[1];
    const day = parts[2];

    const match = range.find((r) => r.month === month && r.day === day);
    if (!match) return acc;

    acc.push({
      uid: item.UID,
      name: item.accounts?.name ?? 'Sin nombre',
      phone: String(item.phone),
      birthdayDay: item.birthday_day,
      daysOffset: match.offset,
    });

    return acc;
  }, []);
};
