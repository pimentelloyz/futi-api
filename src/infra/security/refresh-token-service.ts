import { randomBytes, createHash } from 'crypto';

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export const refreshTokenService = {
  generateRaw(): string {
    // 48 bytes ~ 64 chars base64url
    return base64Url(randomBytes(48));
  },
  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  },
};
