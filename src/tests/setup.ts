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
  positionsBySlug: new Map<string, { slug: string; name: string; description: string | null }>(),
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
  matchAssignmentsByMatchIdAndEvaluator: new Map<
    string,
    Array<{
      matchId: string;
      evaluatorPlayerId: string;
      targetPlayerId: string;
      completedAt: Date | null;
    }>
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
  leaguesById: new Map<
    string,
    { id: string; name: string; slug: string; createdAt: Date; updatedAt: Date }
  >(),
  leagueTeamsByLeagueId: new Map<string, string[]>(),
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
    position: {
      // Pre-seed with two positions for tests
      _init: (() => {
        if (mem.positionsBySlug.size === 0) {
          mem.positionsBySlug.set('GK', { slug: 'GK', name: 'Goalkeeper', description: 'Goleiro' });
          mem.positionsBySlug.set('ST', {
            slug: 'ST',
            name: 'Striker',
            description: 'Centroavante',
          });
        }
      })(),
      findMany: async ({
        orderBy,
        select,
      }: {
        orderBy?: { name?: 'asc' | 'desc' };
        select?: { slug?: boolean; name?: boolean; description?: boolean };
      }) => {
        const list = Array.from(mem.positionsBySlug.values());
        if (orderBy?.name === 'asc') list.sort((a, b) => a.name.localeCompare(b.name));
        if (orderBy?.name === 'desc') list.sort((a, b) => b.name.localeCompare(a.name));
        if (select) {
          return list.map((p) => ({
            slug: select.slug ? p.slug : undefined,
            name: select.name ? p.name : undefined,
            description: select.description ? p.description : undefined,
          }));
        }
        return list;
      },
      update: async ({
        where,
        data,
        select,
      }: {
        where: { slug: string };
        data: { name?: string; description?: string | null };
        select?: { slug?: boolean; name?: boolean; description?: boolean };
      }) => {
        const rec = mem.positionsBySlug.get(where.slug);
        if (!rec) throw new Error('Record to update not found');
        if (typeof data.name === 'string') rec.name = data.name;
        if (data.description !== undefined) rec.description = data.description;
        mem.positionsBySlug.set(where.slug, rec);
        if (select) {
          return {
            slug: select.slug ? rec.slug : undefined,
            name: select.name ? rec.name : undefined,
            description: select.description ? rec.description : undefined,
          };
        }
        return rec;
      },
      delete: async ({ where }: { where: { slug: string } }) => {
        const existed = mem.positionsBySlug.delete(where.slug);
        if (!existed) throw new Error('Record to delete does not exist');
        return { slug: where.slug } as unknown as { slug: string };
      },
    },
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
      findFirst: async ({
        where,
        select,
      }: {
        where?: { userId?: { not?: null } };
        select?: { user?: { select?: { id?: boolean; firebaseUid?: boolean } }; id?: boolean };
      }): Promise<{ id?: string; user?: { id?: string; firebaseUid?: string } } | null> => {
        // Try to find an existing player with a non-null userId
        let found = Array.from(mem.playersById.values()).find((p) => p.userId !== null) || null;

        // If none exists, create a default user and player to satisfy E2E setup
        if (!found && where?.userId?.not === null) {
          // Ensure a default user with firebaseUid 'uid-e2e'
          let user = mem.usersByUid.get('uid-e2e') ?? null;
          if (!user) {
            const id = `user_${++userSeq}`;
            user = {
              id,
              firebaseUid: 'uid-e2e',
              email: 'e2e@example.com',
              displayName: 'E2E User',
            };
            mem.usersByUid.set('uid-e2e', user);
            mem.usersById.set(id, user);
          }
          // Create a linked player
          const pid = `player_${++playerSeq}`;
          const rec = {
            id: pid,
            userId: user.id,
            name: 'E2E Player',
            position: null as string | null,
            number: null as number | null,
            isActive: true,
            photo: null as string | null,
          };
          mem.playersById.set(pid, rec);
          mem.playersByUserId.set(user.id, rec);
          found = rec;
        }

        if (!found) return null;

        // Shape response per select
        const out: { id?: string; user?: { id?: string; firebaseUid?: string } } = {};
        if (select?.id) out.id = found.id;
        if (select?.user?.select) {
          const u = found.userId ? (mem.usersById.get(found.userId) ?? null) : null;
          out.user = {
            id: select.user.select.id ? u?.id : undefined,
            firebaseUid: select.user.select.firebaseUid ? u?.firebaseUid : undefined,
          };
        }
        return out;
      },
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
      count: async ({ where }: { where?: { teams?: { some?: { teamId?: string } } } }) => {
        const teamId = where?.teams?.some?.teamId;
        if (!teamId) return mem.playersById.size;
        let count = 0;
        for (const [pid, tids] of mem.playerTeamsByPlayerId.entries()) {
          void pid;
          if (tids.includes(teamId)) count++;
        }
        return count;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take = 9999,
        select,
      }: {
        where?: { teams?: { some?: { teamId?: string } }; id?: { in?: string[] } };
        orderBy?: Record<string, 'asc' | 'desc'>;
        skip?: number;
        take?: number;
        select?: {
          id?: boolean;
          name?: boolean;
          positionSlug?: boolean;
          number?: boolean;
          isActive?: boolean;
        };
      }) => {
        let list = Array.from(mem.playersById.values());
        // Filter by team membership
        const teamId = where?.teams?.some?.teamId;
        if (teamId) {
          list = list.filter((p) => (mem.playerTeamsByPlayerId.get(p.id) ?? []).includes(teamId));
        }
        // Filter by id in
        const inIds = where?.id?.in;
        if (inIds && inIds.length) {
          list = list.filter((p) => inIds.includes(p.id));
        }
        // Sort by one of the fields (name, number, positionSlug, isActive)
        if (orderBy) {
          const [field, dir] = Object.entries(orderBy)[0] ?? [];
          if (field) {
            const getVal = (p: {
              name: string;
              number: number | null;
              isActive: boolean;
              position?: string | null;
              positionSlug?: string | null;
            }): string | number | boolean | null | undefined => {
              switch (field) {
                case 'name':
                  return p.name;
                case 'number':
                  return p.number ?? null;
                case 'isActive':
                  return p.isActive;
                case 'positionSlug': {
                  const pos = p as { positionSlug?: string | null; position?: string | null };
                  return pos.positionSlug ?? pos.position ?? null;
                }
                default:
                  return undefined;
              }
            };
            list.sort((a, b) => {
              type P = {
                name: string;
                number: number | null;
                isActive: boolean;
                position?: string | null;
                positionSlug?: string | null;
              };
              const av = getVal(a as P);
              const bv = getVal(b as P);
              if (av === bv) return 0;
              if (av === undefined || av === null) return 1;
              if (bv === undefined || bv === null) return -1;
              if (typeof av === 'string' && typeof bv === 'string') {
                return dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
              }
              if (typeof av === 'number' && typeof bv === 'number') {
                return dir === 'desc' ? bv - av : av - bv;
              }
              if (typeof av === 'boolean' && typeof bv === 'boolean') {
                return dir === 'desc' ? Number(bv) - Number(av) : Number(av) - Number(bv);
              }
              return 0;
            });
          }
        }
        const paged = list.slice(skip, skip + take);
        if (select) {
          return paged.map((p) => {
            const pos = p as { positionSlug?: string | null; position?: string | null };
            return {
              id: select.id ? p.id : undefined,
              name: select.name ? p.name : undefined,
              positionSlug: select.positionSlug
                ? (pos.positionSlug ?? pos.position ?? null)
                : undefined,
              number: select.number ? p.number : undefined,
              isActive: select.isActive ? p.isActive : undefined,
            };
          });
        }
        return paged;
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
        data: {
          teams?: {
            connect?: Array<{ id: string }>;
            create?: { teamId: string } | Array<{ teamId: string }>;
          };
          photo?: string | null;
        };
      }) => {
        const rec = mem.playersById.get(where.id) ?? null;
        if (!rec) return null;
        // Handle connect
        if (data.teams?.connect?.length) {
          const current = mem.playerTeamsByPlayerId.get(where.id) ?? [];
          const next = Array.from(new Set([...current, ...data.teams.connect.map((c) => c.id)]));
          mem.playerTeamsByPlayerId.set(where.id, next);
        }
        // Handle create for join table
        const create = data.teams?.create;
        if (create) {
          const toAdd = Array.isArray(create) ? create.map((c) => c.teamId) : [create.teamId];
          const current = mem.playerTeamsByPlayerId.get(where.id) ?? [];
          const next = Array.from(new Set([...current, ...toAdd]));
          mem.playerTeamsByPlayerId.set(where.id, next);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'photo')) {
          rec.photo = data.photo ?? null;
          mem.playersById.set(where.id, rec);
          if (rec.userId) mem.playersByUserId.set(rec.userId, rec);
        }
        return rec;
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
    accessMembership: {
      findFirst: async ({
        where,
      }: {
        where: { userId?: string; teamId?: string; role?: string };
      }) => {
        // Simplificado: sem persistência real de memberships; retorna null por padrão
        void where;
        return null;
      },
      count: async ({
        where,
      }: {
        where: { userId: string; role?: string; teamId?: null; leagueId?: null };
      }) => {
        // For tests, treat any user as ADMIN at global scope when queried
        if (where.role === 'ADMIN' && where.teamId === null && where.leagueId === null) return 1;
        return 0;
      },
      findMany: async ({
        where: _where,
        select,
      }: {
        where: { userId: string; teamId?: { not: null } };
        select?: { teamId?: boolean };
      }) => {
        void _where;
        // Keep simple in tests: return empty unless explicitly populated by tests in future
        const list: Array<{ teamId: string | null }> = [];
        if (select?.teamId) return list.map((x) => ({ teamId: x.teamId }));
        return list;
      },
    },
    matchPlayerEvaluationAssignment: {
      count: async ({
        where,
      }: {
        where: { matchId: string; evaluatorPlayerId: string; completedAt: null };
      }) => {
        const key = `${where.matchId}::${where.evaluatorPlayerId}`;
        const arr = mem.matchAssignmentsByMatchIdAndEvaluator.get(key) ?? [];
        // Count only null completedAt
        return arr.filter((a) => a.completedAt === null).length;
      },
      findMany: async ({
        where,
        select,
      }: {
        where: { matchId: string; evaluatorPlayerId: string; completedAt: null };
        select?: { targetPlayerId?: boolean };
      }) => {
        const key = `${where.matchId}::${where.evaluatorPlayerId}`;
        const arr = mem.matchAssignmentsByMatchIdAndEvaluator.get(key) ?? [];
        const pending = arr.filter((a) => a.completedAt === null);
        if (select?.targetPlayerId)
          return pending.map((a) => ({ targetPlayerId: a.targetPlayerId }));
        return pending;
      },
      create: async ({
        data,
        select,
      }: {
        data: { matchId: string; evaluatorPlayerId: string; targetPlayerId: string };
        select?: { id?: boolean };
      }) => {
        const key = `${data.matchId}::${data.evaluatorPlayerId}`;
        const arr = mem.matchAssignmentsByMatchIdAndEvaluator.get(key) ?? [];
        const id = `assign_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        arr.push({
          matchId: data.matchId,
          evaluatorPlayerId: data.evaluatorPlayerId,
          targetPlayerId: data.targetPlayerId,
          completedAt: null,
        });
        mem.matchAssignmentsByMatchIdAndEvaluator.set(key, arr);
        return select?.id ? { id } : ({ id } as unknown as { id: string });
      },
      _seed: (opts: {
        matchId: string;
        evaluatorPlayerId: string;
        targets: Array<{ playerId: string; completed?: boolean }>;
      }) => {
        const key = `${opts.matchId}::${opts.evaluatorPlayerId}`;
        const list = opts.targets.map((t) => ({
          matchId: opts.matchId,
          evaluatorPlayerId: opts.evaluatorPlayerId,
          targetPlayerId: t.playerId,
          completedAt: t.completed ? new Date() : null,
        }));
        mem.matchAssignmentsByMatchIdAndEvaluator.set(key, list);
      },
    },
    matchLineupEntry: {
      findMany: async ({
        where,
      }: {
        where: { matchId: string; teamId: string };
        select?: { playerId?: boolean };
      }) => {
        void where;
        // Sem lineup seeded, retorna vazio
        return [] as Array<{ playerId: string }>;
      },
    },
    playersOnTeams: {
      findMany: async ({
        where,
        select,
      }: {
        where: { playerId: string };
        select?: { teamId?: boolean };
      }) => {
        const tids = mem.playerTeamsByPlayerId.get(where.playerId) ?? [];
        const list = tids.map((teamId) => ({ teamId }));
        if (select?.teamId) return list.map((x) => ({ teamId: x.teamId }));
        return list;
      },
    },
    league: {
      count: async ({ where }: { where?: { id?: string } }) => {
        if (where?.id) return mem.leaguesById.has(where.id) ? 1 : 0;
        return mem.leaguesById.size;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where?: { id?: string; teams?: { some?: { teamId?: { in?: string[] } } } };
        include?: {
          teams?: { include?: { team?: boolean } };
          groups?: { include?: { teams?: { include?: { team?: boolean } } } };
        };
      }) => {
        let leagues = Array.from(mem.leaguesById.values());
        if (where?.id) leagues = leagues.filter((l) => l.id === where.id);
        const inTeamIds = where?.teams?.some?.teamId?.in ?? undefined;
        if (inTeamIds && inTeamIds.length) {
          leagues = leagues.filter((l) => {
            const tids = mem.leagueTeamsByLeagueId.get(l.id) ?? [];
            return tids.some((tid) => inTeamIds.includes(tid));
          });
        }
        const first = leagues[0] ?? null;
        if (!first) return null;
        if (include?.teams?.include?.team || include?.groups) {
          const tids = mem.leagueTeamsByLeagueId.get(first.id) ?? [];
          const teams = tids
            .map((tid) => mem.teamsById.get(tid))
            .filter(Boolean)
            .map((t) => ({ team: t! }));
          const withTeams = { ...first, teams } as unknown as typeof first & {
            teams: Array<{ team: unknown }>;
          };
          if (include?.groups) {
            // No groups seeded in tests; return empty groups to satisfy include shape
            return { ...withTeams, groups: [] } as unknown as typeof first & {
              teams: Array<{ team: unknown }>;
              groups: unknown[];
            };
          }
          return withTeams;
        }
        return first;
      },
      create: async ({
        data,
      }: {
        data: {
          name: string;
          slug: string;
          description?: string | null;
          startAt?: Date;
          endAt?: Date;
        };
      }) => {
        const id = `league_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date();
        const rec = { id, name: data.name, slug: data.slug, createdAt: now, updatedAt: now };
        mem.leaguesById.set(id, rec);
        return rec;
      },
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id) return mem.leaguesById.get(where.id) ?? null;
        if (where.slug) {
          return Array.from(mem.leaguesById.values()).find((l) => l.slug === where.slug) ?? null;
        }
        return null;
      },
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where?: { teams?: { some?: { teamId?: { in?: string[] } } } };
        include?: { teams?: { include?: { team?: boolean } } };
        orderBy?: { name?: 'asc' | 'desc' };
      }) => {
        let leagues = Array.from(mem.leaguesById.values());
        const inTeamIds = where?.teams?.some?.teamId?.in ?? undefined;
        if (inTeamIds && inTeamIds.length) {
          leagues = leagues.filter((l) => {
            const lteams = mem.leagueTeamsByLeagueId.get(l.id) ?? [];
            return lteams.some((tid) => inTeamIds.includes(tid));
          });
        }
        if (orderBy?.name === 'asc') leagues.sort((a, b) => a.name.localeCompare(b.name));
        if (orderBy?.name === 'desc') leagues.sort((a, b) => b.name.localeCompare(a.name));
        if (include?.teams?.include?.team) {
          return leagues.map((l) => {
            const tids = mem.leagueTeamsByLeagueId.get(l.id) ?? [];
            const teams = tids
              .map((tid) => mem.teamsById.get(tid))
              .filter(Boolean)
              .map((t) => ({ team: t! }));
            return { ...l, teams };
          });
        }
        return leagues;
      },
    },
    leagueTeam: {
      count: async ({ where }: { where: { leagueId: string; teamId: string } }) => {
        const tids = mem.leagueTeamsByLeagueId.get(where.leagueId) ?? [];
        return tids.includes(where.teamId) ? 1 : 0;
      },
      create: async ({
        data,
      }: {
        data: { leagueId: string; teamId: string; division?: string | null };
      }) => {
        const tids = mem.leagueTeamsByLeagueId.get(data.leagueId) ?? [];
        if (tids.includes(data.teamId)) throw new Error('already linked');
        mem.leagueTeamsByLeagueId.set(data.leagueId, [...tids, data.teamId]);
        return {
          id: `lt_${Date.now()}`,
          leagueId: data.leagueId,
          teamId: data.teamId,
          division: data.division ?? null,
        };
      },
    },
  };
  return { prisma };
});
