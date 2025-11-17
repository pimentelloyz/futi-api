import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient, League } from '@prisma/client';

import { LeagueService } from './league.service.js';

// Mock do Prisma Client
const mockPrisma = {
  league: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  accessMembership: {
    findMany: vi.fn(),
  },
  player: {
    findUnique: vi.fn(),
  },
  playersOnTeams: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('LeagueService', () => {
  let service: LeagueService;

  beforeEach(() => {
    service = new LeagueService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('createLeague', () => {
    it('should create a public league successfully', async () => {
      const leagueData = {
        name: 'Liga Pública',
        slug: 'liga-publica',
        description: 'Uma liga aberta ao público',
        isPublic: true,
        isActive: true,
      };

      const mockLeague: League = {
        id: 'league-1',
        ...leagueData,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.league.create).mockResolvedValue(mockLeague);

      const result = await service.createLeague(leagueData);

      expect(result).toEqual(mockLeague);
      expect(mockPrisma.league.findUnique).toHaveBeenCalledWith({
        where: { slug: 'liga-publica' },
      });
      expect(mockPrisma.league.create).toHaveBeenCalledWith({
        data: {
          name: 'Liga Pública',
          slug: 'liga-publica',
          description: 'Uma liga aberta ao público',
          icon: undefined,
          banner: undefined,
          startAt: undefined,
          endAt: undefined,
          isActive: true,
          isPublic: true,
        },
      });
    });

    it('should create a private league by default', async () => {
      const leagueData = {
        name: 'Liga Privada',
        slug: 'liga-privada',
      };

      const mockLeague: League = {
        id: 'league-2',
        name: 'Liga Privada',
        slug: 'liga-privada',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.league.create).mockResolvedValue(mockLeague);

      const result = await service.createLeague(leagueData);

      expect(result.isPublic).toBe(false);
      expect(result.isActive).toBe(true);
    });

    it('should throw error if name is empty', async () => {
      await expect(service.createLeague({ name: '', slug: 'test' })).rejects.toThrow(
        'League name is required',
      );
    });

    it('should throw error if slug is empty', async () => {
      await expect(service.createLeague({ name: 'Test', slug: '' })).rejects.toThrow(
        'League slug is required',
      );
    });

    it('should throw error if slug already exists', async () => {
      const existingLeague: League = {
        id: 'existing-id',
        name: 'Existing',
        slug: 'duplicate-slug',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(existingLeague);

      await expect(
        service.createLeague({ name: 'New League', slug: 'duplicate-slug' }),
      ).rejects.toThrow('League slug already exists');
    });
  });

  describe('listPublicLeagues', () => {
    it('should list only public leagues', async () => {
      const mockLeagues: League[] = [
        {
          id: 'league-1',
          name: 'Liga Pública 1',
          slug: 'liga-publica-1',
          description: null,
          icon: null,
          banner: null,
          startAt: null,
          endAt: null,
          isActive: true,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'league-2',
          name: 'Liga Pública 2',
          slug: 'liga-publica-2',
          description: null,
          icon: null,
          banner: null,
          startAt: null,
          endAt: null,
          isActive: true,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.league.count).mockResolvedValue(2);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue(mockLeagues);

      const result = await service.listPublicLeagues();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([expect.objectContaining({ isPublic: true })]),
          }),
        }),
      );
    });
  });

  describe('listLeagues', () => {
    it('should list leagues with filters', async () => {
      const mockLeagues: League[] = [
        {
          id: 'league-1',
          name: 'Liga Ativa',
          slug: 'liga-ativa',
          description: null,
          icon: null,
          banner: null,
          startAt: null,
          endAt: null,
          isActive: true,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.league.count).mockResolvedValue(1);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue(mockLeagues);

      const result = await service.listLeagues({ isActive: true }, { page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasNext).toBe(false);
    });

    it('should apply text search filter', async () => {
      vi.mocked(mockPrisma.league.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue([]);

      await service.listLeagues({ q: 'search term' });

      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    name: expect.objectContaining({
                      contains: 'search term',
                      mode: 'insensitive',
                    }),
                  }),
                  expect.objectContaining({
                    slug: expect.objectContaining({
                      contains: 'search term',
                      mode: 'insensitive',
                    }),
                  }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const mockLeagues = Array.from({ length: 5 }, (_, i) => ({
        id: `league-${i}`,
        name: `Liga ${i}`,
        slug: `liga-${i}`,
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as League[];

      vi.mocked(mockPrisma.league.count).mockResolvedValue(25);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue(mockLeagues);

      const result = await service.listLeagues({}, { page: 2, pageSize: 5 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.total).toBe(25);
      expect(result.hasNext).toBe(true);
      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('should enforce maximum page size of 20', async () => {
      vi.mocked(mockPrisma.league.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue([]);

      await service.listLeagues({}, { pageSize: 100 });

      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it('should filter by date ranges', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      vi.mocked(mockPrisma.league.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue([]);

      await service.listLeagues({
        startAtFrom: startDate,
        startAtTo: endDate,
      });

      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                startAt: expect.objectContaining({
                  gte: startDate,
                  lte: endDate,
                }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('getLeagueById', () => {
    it('should return league by id', async () => {
      const mockLeague: League = {
        id: 'league-1',
        name: 'Test League',
        slug: 'test-league',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(mockLeague);

      const result = await service.getLeagueById('league-1');

      expect(result).toEqual(mockLeague);
      expect(mockPrisma.league.findUnique).toHaveBeenCalledWith({
        where: { id: 'league-1' },
      });
    });

    it('should return null if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      const result = await service.getLeagueById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getLeagueBySlug', () => {
    it('should return league by slug', async () => {
      const mockLeague: League = {
        id: 'league-1',
        name: 'Test League',
        slug: 'test-league',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(mockLeague);

      const result = await service.getLeagueBySlug('test-league');

      expect(result).toEqual(mockLeague);
      expect(mockPrisma.league.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-league' },
      });
    });
  });

  describe('updateLeague', () => {
    const existingLeague: League = {
      id: 'league-1',
      name: 'Old Name',
      slug: 'old-slug',
      description: null,
      icon: null,
      banner: null,
      startAt: null,
      endAt: null,
      isActive: true,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update league successfully', async () => {
      const updateData = {
        name: 'New Name',
        isPublic: true,
      };

      const updatedLeague = { ...existingLeague, ...updateData };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(existingLeague);
      vi.mocked(mockPrisma.league.update).mockResolvedValue(updatedLeague);

      const result = await service.updateLeague('league-1', updateData);

      expect(result.name).toBe('New Name');
      expect(result.isPublic).toBe(true);
    });

    it('should throw error if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      await expect(service.updateLeague('non-existent', { name: 'Test' })).rejects.toThrow(
        'League not found',
      );
    });

    it('should throw error if new slug already exists', async () => {
      const anotherLeague: League = {
        id: 'league-2',
        name: 'Another',
        slug: 'new-slug',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.league.findUnique)
        .mockResolvedValueOnce(existingLeague)
        .mockResolvedValueOnce(anotherLeague);

      await expect(service.updateLeague('league-1', { slug: 'new-slug' })).rejects.toThrow(
        'League slug already exists',
      );
    });

    it('should allow updating to same slug', async () => {
      const updatedLeague = { ...existingLeague, name: 'Updated Name' };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(existingLeague);
      vi.mocked(mockPrisma.league.update).mockResolvedValue(updatedLeague);

      const result = await service.updateLeague('league-1', {
        slug: 'old-slug',
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      // Não deve ter verificado se o slug existe (pois é o mesmo)
      expect(mockPrisma.league.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteLeague', () => {
    it('should soft delete league', async () => {
      const league: League = {
        id: 'league-1',
        name: 'Test',
        slug: 'test',
        description: null,
        icon: null,
        banner: null,
        startAt: null,
        endAt: null,
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deletedLeague = { ...league, isActive: false };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(league);
      vi.mocked(mockPrisma.league.update).mockResolvedValue(deletedLeague);

      const result = await service.deleteLeague('league-1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.league.update).toHaveBeenCalledWith({
        where: { id: 'league-1' },
        data: { isActive: false },
      });
    });

    it('should throw error if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      await expect(service.deleteLeague('non-existent')).rejects.toThrow('League not found');
    });
  });

  describe('isLeaguePublic', () => {
    it('should return true for public league', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue({
        isPublic: true,
      } as League);

      const result = await service.isLeaguePublic('league-1');

      expect(result).toBe(true);
    });

    it('should return false for private league', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue({
        isPublic: false,
      } as League);

      const result = await service.isLeaguePublic('league-1');

      expect(result).toBe(false);
    });

    it('should return false if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      const result = await service.isLeaguePublic('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('listUserLeagues', () => {
    it('should return user leagues from access memberships', async () => {
      const mockLeagues: League[] = [
        {
          id: 'league-1',
          name: 'User League',
          slug: 'user-league',
          description: null,
          icon: null,
          banner: null,
          startAt: null,
          endAt: null,
          isActive: true,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue([
        { teamId: 'team-1' },
      ] as never);
      vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue(mockLeagues);

      const result = await service.listUserLeagues('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User League');
    });

    it('should return empty array if user has no teams', async () => {
      vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.player.findUnique).mockResolvedValue(null);

      const result = await service.listUserLeagues('user-1');

      expect(result).toEqual([]);
    });

    it('should combine teams from access and player memberships', async () => {
      vi.mocked(mockPrisma.accessMembership.findMany).mockResolvedValue([
        { teamId: 'team-1' },
      ] as never);
      vi.mocked(mockPrisma.player.findUnique).mockResolvedValue({
        id: 'player-1',
      } as never);
      vi.mocked(mockPrisma.playersOnTeams.findMany).mockResolvedValue([
        { teamId: 'team-2' },
      ] as never);
      vi.mocked(mockPrisma.league.findMany).mockResolvedValue([]);

      await service.listUserLeagues('user-1');

      expect(mockPrisma.league.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teams: expect.objectContaining({
              some: expect.objectContaining({
                teamId: expect.objectContaining({
                  in: expect.arrayContaining(['team-1', 'team-2']),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});
