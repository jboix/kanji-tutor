/**
 * A name for this device in the devices list, from what the browser says it runs on: "iPhone",
 * "Chrome on Windows". The person can change it before signing in.
 */
const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Mac OS X|Macintosh/, 'Mac'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'Chromebook'],
  [/Linux/, 'Linux'],
];

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const first = (list: [RegExp, string][], text: string) => list.find(([re]) => re.test(text))?.[1];

export function deviceName(userAgent: string): string {
  const system = first(SYSTEMS, userAgent);
  if (system === 'iPhone' || system === 'iPad' || system === 'Android') return system;
  const browser = first(BROWSERS, userAgent);
  if (system && browser) return `${browser} on ${system}`;
  return system ?? browser ?? 'Device';
}
