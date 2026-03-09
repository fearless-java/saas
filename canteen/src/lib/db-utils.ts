export function toDbDate(date: Date, isSQLite: boolean): Date | number {
  if (isSQLite) {
    return date.getTime();
  }
  return date;
}
