import { describe, it, expect } from 'vitest';

describe('OpenAPI docs - Positions', () => {
  it('should include Positions tag and ideally the endpoints', async () => {
    const { openapi } = await import('../main/docs/openapi.js');
    expect(openapi.tags?.some((t: { name: string }) => t.name === 'Positions')).toBe(true);
    const listPath = (openapi.paths as Record<string, unknown>)?.['/api/positions'] as
      | Record<string, unknown>
      | undefined;
    if (listPath) expect(Object.keys(listPath)).toContain('get');
    const itemPath = (openapi.paths as Record<string, unknown>)?.['/api/positions/{slug}'] as
      | Record<string, unknown>
      | undefined;
    if (itemPath)
      expect(Object.keys(itemPath)).toEqual(expect.arrayContaining(['patch', 'delete']));
  });
});
