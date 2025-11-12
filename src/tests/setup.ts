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
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
    DIRECT_URL: 'postgresql://user:pass@localhost:5432/test',
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
  playersById: new Map<
    string,
    {
      id: string;
      userId: string | null;
      name: string;
      position: string | null;
      number: number | null;
      isActive: boolean;
      photo?: string | null;
    }
  >(),
  playersByUserId: new Map<
    string,
    {
      id: string;
      userId: string | null;
      name: string;
      position: string | null;
      number: number | null;
      isActive: boolean;
      photo?: string | null;
    }
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
  playerSkillsByPlayerId: new Map<
    string,
    {
      id: string;
      playerId: string;
      preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
      attack: number;
      defense: number;
      shooting: number;
      ballControl: number;
      pace: number;
      passing: number;
      dribbling: number;
      physical: number;
      createdAt: Date;
      updatedAt: Date;
    }
  >(),
  teamsById: new Map<
    string,
    { id: string; name: string; icon: string | null; description: string | null; isActive: boolean }
  >(),
  matchesById: new Map<
    string,
    {
      id: string;
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date;
      status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
      homeScore: number;
      awayScore: number;
      createdAt: Date;
      updatedAt: Date;
    }
  >(),
  matchEventsByMatchId: new Map<
    string,
    Array<{
      id: string;
      matchId: string;
      teamId: string | null;
      playerId: string | null;
      minute: number | null;
      type: 'GOAL' | 'FOUL' | 'YELLOW_CARD' | 'RED_CARD' | 'OWN_GOAL';
      createdAt: Date;
    }>
  >(),
  playerTeamsByPlayerId: new Map<string, string[]>(),
  userPushTokens: new Map<
    string,
    { id: string; userId: string; token: string; platform: string | null; createdAt: Date }
  >(),
};
let userSeq = 0;
let tokenSeq = 0;
let playerSeq = 0;
let teamSeq = 0;
let matchSeq = 0;
let eventSeq = 0;
let skillSeq = 0;

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
    team: {
      create: async ({
        data,
        select,
      }: {
        data: {
          name: string;
          icon?: string | null;
          description?: string | null;
          isActive?: boolean;
        };
        select?: { id: boolean };
      }): Promise<
        | { id: string }
        | {
            id: string;
            name: string;
            icon: string | null;
            description: string | null;
            isActive: boolean;
          }
      > => {
        const id = `team_${++teamSeq}`;
        const rec = {
          id,
          name: data.name,
          icon: data.icon ?? null,
          description: data.description ?? null,
          isActive: data.isActive ?? true,
        };
        mem.teamsById.set(id, rec);
        return select && select.id ? { id } : rec;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take = 9999,
        select,
      }: {
        where?: { isActive?: boolean };
        orderBy?: { name?: 'asc' | 'desc' };
        skip?: number;
        take?: number;
        select?: {
          id?: boolean;
          name?: boolean;
          icon?: boolean;
          description?: boolean;
          isActive?: boolean;
        };
      }) => {
        let list = Array.from(mem.teamsById.values());
        if (typeof where?.isActive === 'boolean') {
          list = list.filter((t) => t.isActive === where!.isActive);
        }
        if (orderBy?.name === 'asc') list.sort((a, b) => a.name.localeCompare(b.name));
        if (orderBy?.name === 'desc') list.sort((a, b) => b.name.localeCompare(a.name));
        const paged = list.slice(skip, skip + take);
        if (select) {
          return paged.map((t) => ({
            id: select.id ? t.id : undefined,
            name: select.name ? t.name : undefined,
            icon: select.icon ? t.icon : undefined,
            description: select.description ? t.description : undefined,
            isActive: select.isActive ? t.isActive : undefined,
          }));
        }
        return paged;
      },
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: {
          id?: boolean;
          name?: boolean;
          players?: {
            select: {
              id?: boolean;
              name?: boolean;
              position?: boolean;
              number?: boolean;
              isActive?: boolean;
            };
          };
        };
      }) => {
        const team = mem.teamsById.get(where.id) ?? null;
        if (!team) return null;
        const out: {
          id?: string;
          name?: string;
          players?: Array<{
            id: string;
            name: string;
            position: string | null;
            number: number | null;
            isActive: boolean;
          }>;
        } = {};
        if (select?.players) {
          const items: Array<{
            id: string;
            name: string;
            position: string | null;
            number: number | null;
            isActive: boolean;
          }> = [];
          for (const p of mem.playersById.values()) {
            const tids = mem.playerTeamsByPlayerId.get(p.id) ?? [];
            if (tids.includes(where.id)) {
              items.push({
                id: p.id,
                name: p.name,
                position: p.position,
                number: p.number,
                isActive: p.isActive,
              });
            }
          }
          out.players = items;
        }
        if (select?.id) out.id = team.id;
        if (select?.name) out.name = team.name;
        if (Object.keys(out).length > 0) return out;
        return team;
      },
    },
    user: {
      findUnique: async ({ where }: { where: { id?: string; firebaseUid?: string } }) => {
        if (where.id) return mem.usersById.get(where.id) ?? null;
        if (where.firebaseUid) return mem.usersByUid.get(where.firebaseUid) ?? null;
        return null;
      },
    },
    player: {
      create: async ({
        data,
        select,
      }: {
        data: {
          name: string;
          position?: string | null;
          number?: number | null;
          isActive?: boolean;
          userId?: string;
          photo?: string | null;
          teams?: unknown;
        };
        select?: { id: boolean };
      }): Promise<
        | { id: string }
        | {
            id: string;
            userId: string | null;
            name: string;
            position: string | null;
            number: number | null;
            isActive: boolean;
            photo?: string | null;
          }
      > => {
        const id = `player_${++playerSeq}`;
        const rec: {
          id: string;
          userId: string | null;
          name: string;
          position: string | null;
          number: number | null;
          isActive: boolean;
          photo?: string | null;
        } = {
          id,
          userId: data.userId ?? null,
          name: data.name,
          position: data.position ?? null,
          number: data.number ?? null,
          isActive: data.isActive ?? true,
          photo: data.photo ?? null,
        };
        mem.playersById.set(id, rec);
        if (rec.userId) mem.playersByUserId.set(rec.userId, rec);
        return select && select.id ? { id } : rec;
      },
      findUnique: async ({
        where,
        select,
      }: {
        where: { userId?: string };
        select?: { id?: boolean; teams?: { select: { id: boolean; name: boolean } } };
      }): Promise<
        | {
            id: string;
            userId: string | null;
            name: string;
            position: string | null;
            number: number | null;
            isActive: boolean;
            photo?: string | null;
          }
        | { id: string; teams: Array<{ id: string; name: string }> }
        | null
      > => {
        if (where.userId) {
          const rec = mem.playersByUserId.get(where.userId) ?? null;
          if (!rec) return null;
          if (select?.teams) {
            const teamIds = mem.playerTeamsByPlayerId.get(rec.id) ?? [];
            const teams: Array<{ id: string; name: string }> = [];
            for (const tid of teamIds) {
              const t = mem.teamsById.get(tid);
              if (t) teams.push({ id: t.id, name: t.name });
            }
            return { id: rec.id, teams } as {
              id: string;
              teams: Array<{ id: string; name: string }>;
            };
          }
          return rec;
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { teams?: { connect?: Array<{ id: string }> }; photo?: string | null };
      }) => {
        if (data.teams?.connect?.length) {
          const current = mem.playerTeamsByPlayerId.get(where.id) ?? [];
          const next = Array.from(new Set([...current, ...data.teams.connect.map((c) => c.id)]));
          mem.playerTeamsByPlayerId.set(where.id, next);
        }
        const rec = mem.playersById.get(where.id);
        if (rec && Object.prototype.hasOwnProperty.call(data, 'photo')) {
          rec.photo = data.photo ?? null;
          mem.playersById.set(where.id, rec);
          if (rec.userId) mem.playersByUserId.set(rec.userId, rec);
        }
        return rec ?? null;
      },
    },
    match: {
      create: async ({
        data,
        select,
      }: {
        data: {
          homeTeamId: string;
          awayTeamId: string;
          scheduledAt: Date;
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
          homeScore?: number;
          awayScore?: number;
        };
        select?: { id: boolean };
      }): Promise<
        | { id: string }
        | {
            id: string;
            homeTeamId: string;
            awayTeamId: string;
            scheduledAt: Date;
            status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
            homeScore: number;
            awayScore: number;
            createdAt: Date;
            updatedAt: Date;
          }
      > => {
        const id = `match_${++matchSeq}`;
        const now = new Date();
        const rec = {
          id,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          scheduledAt: data.scheduledAt,
          status: data.status ?? 'SCHEDULED',
          homeScore: data.homeScore ?? 0,
          awayScore: data.awayScore ?? 0,
          createdAt: now,
          updatedAt: now,
        };
        mem.matchesById.set(id, rec);
        return select && select.id ? { id } : rec;
      },
      count: async ({
        where,
      }: {
        where: {
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
          OR?: Array<{ homeTeamId?: string; awayTeamId?: string }>;
          scheduledAt?: { gte?: Date; lte?: Date };
        };
      }) => {
        const list = Array.from(mem.matchesById.values()).filter((m) => {
          if (where?.status && m.status !== where.status) return false;
          if (where?.OR) {
            const ok = where.OR.some(
              (cond) => m.homeTeamId === cond.homeTeamId || m.awayTeamId === cond.awayTeamId,
            );
            if (!ok) return false;
          }
          const schedCnt = where?.scheduledAt;
          if (schedCnt) {
            const gte = schedCnt.gte ? m.scheduledAt >= schedCnt.gte : true;
            const lte = schedCnt.lte ? m.scheduledAt <= schedCnt.lte : true;
            if (!(gte && lte)) return false;
          }
          return true;
        });
        return list.length;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take = 9999,
        select,
      }: {
        where?: {
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
          OR?: Array<{ homeTeamId?: string; awayTeamId?: string }>;
          scheduledAt?: { gte?: Date; lte?: Date };
        };
        orderBy?: { scheduledAt?: 'asc' | 'desc' };
        skip?: number;
        take?: number;
        select?: {
          id?: boolean;
          homeTeamId?: boolean;
          awayTeamId?: boolean;
          scheduledAt?: boolean;
          status?: boolean;
          homeScore?: boolean;
          awayScore?: boolean;
          venue?: boolean;
        };
      }) => {
        let list = Array.from(mem.matchesById.values());
        if (where?.status) list = list.filter((m) => m.status === where.status);
        if (where?.OR)
          list = list.filter((m) =>
            where.OR!.some(
              (cond) => m.homeTeamId === cond.homeTeamId || m.awayTeamId === cond.awayTeamId,
            ),
          );
        const schedMany = where?.scheduledAt;
        if (schedMany) {
          const { gte, lte } = schedMany;
          if (gte) list = list.filter((m) => m.scheduledAt >= gte);
          if (lte) list = list.filter((m) => m.scheduledAt <= lte);
        }
        if (orderBy?.scheduledAt === 'asc')
          list.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
        if (orderBy?.scheduledAt === 'desc')
          list.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
        const paged = list.slice(skip, skip + take);
        if (select) {
          return paged.map((m) => ({
            id: m.id,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            scheduledAt: m.scheduledAt,
            status: m.status,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            venue: null,
          }));
        }
        return paged;
      },
      findFirst: async ({
        where,
        orderBy,
        select,
      }: {
        where?: {
          status?: 'SCHEDULED';
          scheduledAt?: { gte?: Date };
          OR?: Array<{ homeTeamId?: string; awayTeamId?: string }>;
        };
        orderBy?: { scheduledAt?: 'asc' | 'desc' };
        select?: {
          id?: boolean;
          scheduledAt?: boolean;
          venue?: boolean;
          homeTeamId?: boolean;
          awayTeamId?: boolean;
        };
      }) => {
        let list = Array.from(mem.matchesById.values());
        if (where?.status) list = list.filter((m) => m.status === where.status);
        const sched = where?.scheduledAt;
        if (sched?.gte) list = list.filter((m) => m.scheduledAt >= sched.gte!);
        if (where?.OR)
          list = list.filter((m) =>
            where.OR!.some(
              (cond) => m.homeTeamId === cond.homeTeamId || m.awayTeamId === cond.awayTeamId,
            ),
          );
        if (orderBy?.scheduledAt === 'asc')
          list.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
        if (orderBy?.scheduledAt === 'desc')
          list.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
        const rec = list[0] ?? null;
        if (!rec) return null;
        if (select)
          return {
            id: rec.id,
            scheduledAt: rec.scheduledAt,
            venue: null as string | null,
            homeTeamId: rec.homeTeamId,
            awayTeamId: rec.awayTeamId,
          };
        return rec;
      },
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: { id?: boolean; status?: boolean };
      }) => {
        const rec = mem.matchesById.get(where.id) ?? null;
        if (!rec) return null;
        if (select) return { id: rec.id, status: rec.status };
        return rec;
      },
      update: async ({
        where,
        data,
        select,
      }: {
        where: { id: string };
        data: {
          homeScore?: number;
          awayScore?: number;
          status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
        };
        select?: { id?: boolean; status?: boolean };
      }) => {
        const rec = mem.matchesById.get(where.id);
        if (!rec) throw new Error('not_found');
        if (typeof data.homeScore === 'number') rec.homeScore = data.homeScore;
        if (typeof data.awayScore === 'number') rec.awayScore = data.awayScore;
        if (typeof data.status === 'string') rec.status = data.status;
        rec.updatedAt = new Date();
        mem.matchesById.set(where.id, rec);
        if (select) return { id: rec.id, status: rec.status };
        return rec;
      },
    },
    matchEvent: {
      create: async ({
        data,
        select,
      }: {
        data: {
          matchId: string;
          teamId?: string | null;
          playerId?: string | null;
          minute?: number | null;
          type: 'GOAL' | 'FOUL' | 'YELLOW_CARD' | 'RED_CARD' | 'OWN_GOAL';
        };
        select?: { id: boolean };
      }) => {
        const id = `event_${++eventSeq}`;
        const rec = {
          id,
          matchId: data.matchId,
          teamId: data.teamId ?? null,
          playerId: data.playerId ?? null,
          minute: data.minute ?? null,
          type: data.type,
          createdAt: new Date(),
        };
        const arr = mem.matchEventsByMatchId.get(data.matchId) ?? [];
        arr.push(rec);
        mem.matchEventsByMatchId.set(data.matchId, arr);
        return select && select.id ? { id } : rec;
      },
      findMany: async ({ where }: { where: { matchId: string } }) => {
        const arr = mem.matchEventsByMatchId.get(where.matchId) ?? [];
        const sorted = [...arr].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return sorted;
      },
    },
    playerSkill: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { playerId: string };
        create: {
          playerId: string;
          preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
          attack: number;
          defense: number;
          shooting: number;
          ballControl: number;
          pace: number;
          passing: number;
          dribbling: number;
          physical: number;
        };
        update: {
          preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
          attack: number;
          defense: number;
          shooting: number;
          ballControl: number;
          pace: number;
          passing: number;
          dribbling: number;
          physical: number;
        };
      }) => {
        const existing = mem.playerSkillsByPlayerId.get(where.playerId);
        const now = new Date();
        if (existing) {
          const rec = {
            ...existing,
            ...update,
            updatedAt: now,
          };
          mem.playerSkillsByPlayerId.set(where.playerId, rec);
          return rec;
        } else {
          const id = `skill_${++skillSeq}`;
          const rec = {
            id,
            playerId: create.playerId,
            preferredFoot: create.preferredFoot,
            attack: create.attack,
            defense: create.defense,
            shooting: create.shooting,
            ballControl: create.ballControl,
            pace: create.pace,
            passing: create.passing,
            dribbling: create.dribbling,
            physical: create.physical,
            createdAt: now,
            updatedAt: now,
          };
          mem.playerSkillsByPlayerId.set(where.playerId, rec);
          return rec;
        }
      },
      findUnique: async ({ where }: { where: { playerId: string } }) => {
        return mem.playerSkillsByPlayerId.get(where.playerId) ?? null;
      },
    },
    userPushToken: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { userId_token: { userId: string; token: string } };
        create: { userId: string; token: string; platform: string | null };
        update: { platform: string | null };
      }) => {
        const { userId, token } = where.userId_token;
        const key = `${userId}::${token}`;
        const existing = mem.userPushTokens.get(key) ?? null;
        if (existing) {
          const rec = { ...existing, platform: update.platform ?? existing.platform };
          mem.userPushTokens.set(key, rec);
          return rec;
        } else {
          const id = `upt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const rec = {
            id,
            userId,
            token,
            platform: create.platform ?? null,
            createdAt: new Date(),
          };
          mem.userPushTokens.set(key, rec);
          return rec;
        }
      },
    },
  };
  return { prisma };
});
