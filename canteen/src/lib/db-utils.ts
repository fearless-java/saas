export function toDbDate(date: Date, isSQLite: boolean): Date | number {
  if (isSQLite) {
    return date.getTime();
  }
  return date;
}

export function serializeForJson(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (typeof data === 'number' && data > 1000000000000 && data < 2000000000000) {
    return new Date(data).toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeForJson);
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeForJson(value);
    }
    return result;
  }

  return data;
}
