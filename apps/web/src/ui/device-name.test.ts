import { describe, expect, it } from 'vitest';
import { deviceName } from './device-name.ts';

describe('the name of this device', () => {
  it('says the phone, or the browser on the computer', () => {
    const iphone =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Safari/604.1';
    expect(deviceName(iphone)).toBe('iPhone');
    const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36';
    expect(deviceName(windows)).toBe('Chrome on Windows');
    expect(deviceName('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Firefox/131.0')).toBe(
      'Firefox on Mac',
    );
    expect(deviceName('curl/8')).toBe('Device');
  });
});
