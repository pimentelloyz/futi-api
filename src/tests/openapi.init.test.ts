import { describe, it, expect } from 'vitest';

describe('OpenAPI docs', () => {
  it('should include /api/users/init path', async () => {
    const { openapi } = await import('../main/docs/openapi.js');
    expect(openapi.paths['/api/users/init']).toBeTruthy();
    const post = openapi.paths['/api/users/init'] as Record<string, unknown>;
    expect(Object.keys(post)).toContain('post');
  });
});
