export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface RefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string, revokedAt?: Date): Promise<void>;
  revokeAllForUser?(userId: string): Promise<void>; // optional future use
}
