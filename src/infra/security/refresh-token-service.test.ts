import { describe, it, expect } from 'vitest';

import { refreshTokenService } from './refresh-token-service.js';

describe('refreshTokenService', () => {
  it('should generate and hash a token', () => {
    const raw = refreshTokenService.generateRaw();
    expect(typeof raw).toBe('string');
    expect(raw.length).toBeGreaterThanOrEqual(40);
    const hash = refreshTokenService.hash(raw);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
