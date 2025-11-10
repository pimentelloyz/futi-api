import { vi } from 'vitest';

// Mock firebase admin antes de qualquer controller
vi.mock('../infra/firebase/admin.js', () => {
  return {
    verifyIdToken: vi
      .fn()
      .mockResolvedValue({ uid: 'uid-e2e', email: 'e2e@example.com', name: 'E2E User' }),
    getFirebaseApp: vi.fn(),
    sendNotification: vi.fn(),
  };
});

// Mock env to avoid strict validation in tests
vi.mock('../main/config/env.js', () => {
  const fake: Record<string, string | undefined> = {
    DATABASE_URL: 'mysql://user:pass@localhost:3306/test',
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_CLIENT_EMAIL: 'test@example.com',
    FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n',
    JWT_SECRET: 'test-secret',
    NEXT_PUBLIC_FIREBASE_API_KEY: undefined,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: undefined,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: undefined,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: undefined,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: undefined,
    NEXT_PUBLIC_FIREBASE_APP_ID: undefined,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: undefined,
    REFRESH_TOKEN_TTL_DAYS: '30',
  };
  return { getEnv: () => fake };
});

// In-memory store para simular repositórios Prisma
const mem = {
  usersByUid: new Map<
    string,
    { id: string; firebaseUid: string; email?: string | null; displayName?: string | null }
  >(),
  usersById: new Map<
    string,
    { id: string; firebaseUid: string; email?: string | null; displayName?: string | null }
  >(),
  refresh: new Map<
    string,
    {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
      createdAt: Date;
    }
  >(),
};
let userSeq = 0;
let tokenSeq = 0;

vi.mock('../infra/repositories/prisma-user-repository.js', async () => {
  class PrismaUserRepository {
    async upsertByFirebase(data: {
      firebaseUid: string;
      email?: string | null;
      displayName?: string | null;
    }) {
      let existing = mem.usersByUid.get(data.firebaseUid);
      if (!existing) {
        const id = `user_${++userSeq}`;
        existing = {
          id,
          firebaseUid: data.firebaseUid,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
        };
        mem.usersByUid.set(data.firebaseUid, existing);
        mem.usersById.set(id, existing);
      } else {
        existing.email = data.email ?? null;
        existing.displayName = data.displayName ?? null;
      }
      return {
        id: existing.id,
        firebaseUid: existing.firebaseUid,
        email: existing.email ?? null,
        displayName: existing.displayName ?? null,
      };
    }
  }
  return { PrismaUserRepository };
});

vi.mock('../infra/repositories/prisma-refresh-token-repository.js', async () => {
  class PrismaRefreshTokenRepository {
    async create(userId: string, tokenHash: string, expiresAt: Date) {
      const id = `rt_${++tokenSeq}`;
      const rec = { id, userId, tokenHash, expiresAt, revokedAt: null, createdAt: new Date() };
      mem.refresh.set(id, rec);
      return rec;
    }
    async findByHash(tokenHash: string) {
      const rec = Array.from(mem.refresh.values()).find((r) => r.tokenHash === tokenHash) || null;
      return rec;
    }
    async revokeById(id: string, revokedAt: Date = new Date()) {
      const rec = mem.refresh.get(id);
      if (rec) rec.revokedAt = revokedAt;
    }
    async revokeAllForUser(userId: string) {
      for (const rec of mem.refresh.values()) {
        if (rec.userId === userId && !rec.revokedAt) rec.revokedAt = new Date();
      }
    }
  }
  return { PrismaRefreshTokenRepository };
});

vi.mock('../infra/prisma/client.js', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { id?: string; firebaseUid?: string } }) => {
        if (where.id) return mem.usersById.get(where.id) ?? null;
        if (where.firebaseUid) return mem.usersByUid.get(where.firebaseUid) ?? null;
        return null;
      },
    },
  };
  return { prisma };
});
