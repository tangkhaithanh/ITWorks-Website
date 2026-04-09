export function serializeSocketPayload(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) return value.map((v) => serializeSocketPayload(v));

  if (typeof value === 'object') {
    const out: any = {};
    for (const key of Object.keys(value)) {
      out[key] = serializeSocketPayload(value[key]);
    }
    return out;
  }

  return value;
}

