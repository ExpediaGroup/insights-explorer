export function destring(value: string | Array<any> | Record<string, string>): any {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object') {
    return destringObject(value);
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue === 'null') {
    return null;
  }
  if (lowerValue === 'undefined') {
    return undefined;
  }
  if (lowerValue === 'true') {
    return true;
  }
  if (lowerValue === 'false') {
    return false;
  }
  if (lowerValue === 'nan') {
    return NaN;
  }
  if (lowerValue === '-nan') {
    return -NaN;
  }
  if (lowerValue === 'infinity') {
    return Infinity;
  }
  if (lowerValue === '-infinity') {
    return -Infinity;
  }
  if (lowerValue.startsWith('0x')) {
    return parseInt(value, 16);
  }
  if (lowerValue.startsWith('0o')) {
    return parseInt(value, 8);
  }
  if (lowerValue.startsWith('0b')) {
    return parseInt(value, 2);
  }
  // try parse int
  if (value.match(/^-?\d+$/)) {
    return parseInt(value, 10);
  }
  if (value.match(/^-?\d*\.\d+$/)) {
    return parseFloat(value);
  }
  if (value.match(/^-?\d*\.\d*(e[+-]?\d+)?$/)) {
    return parseFloat(value);
  }

  return value;
}

/**
 * Destringify the values of an object, e.g. convert "true" to true.
 * @param object Object
 */
export function destringObject(object: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, destring(value)]));
}
