/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

import { LeagueStandingService } from './league-standing.service.js';

// Mock do Prisma Client
const mockPrisma = {
  leaguePhase: {
    findUnique: vi.fn(),
  },
  team: {
    findMany: vi.fn(),
  },
  leagueStanding: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
} as unknown as PrismaClient;

describe('LeagueStandingService', () => {
  let service: LeagueStandingService;

  beforeEach(() => {
    service = new LeagueStandingService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('createStandingsForPhase', () => {
    it('should create standings for all teams in a phase', async () => {
      const mockPhase = {
        id: 'phase-1',
        leagueId: 'league-1',
        league: {
          teams: [{ teamId: 'team-1' }, { teamId: 'team-2' }, { teamId: 'team-3' }],
        },
      };

      vi.mocked(mockPrisma.leaguePhase.findUnique).mockResolvedValue(mockPhase as any);
      vi.mocked(mockPrisma.leagueStanding.create).mockResolvedValue({} as any);

      await service.createStandingsForPhase('phase-1');

      expect(mockPrisma.leagueStanding.create).toHaveBeenCalledTimes(3);
      expect(mockPrisma.leagueStanding.create).toHaveBeenCalledWith({
        data: {
          phaseId: 'phase-1',
          teamId: 'team-1',
          groupId: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw error if phase not found', async () => {
      vi.mocked(mockPrisma.leaguePhase.findUnique).mockResolvedValue(null);

      await expect(service.createStandingsForPhase('non-existent')).rejects.toThrow(
        'Fase não encontrada',
      );
    });

    it('should create standings for specific group', async () => {
      const mockPhase = {
        id: 'phase-1',
        leagueId: 'league-1',
        league: {
          teams: [{ teamId: 'team-1' }, { teamId: 'team-2' }],
        },
      };

      vi.mocked(mockPrisma.leaguePhase.findUnique).mockResolvedValue(mockPhase as any);
      vi.mocked(mockPrisma.leagueStanding.create).mockResolvedValue({} as any);

      await service.createStandingsForPhase('phase-1', 'group-a');

      expect(mockPrisma.leagueStanding.create).toHaveBeenCalledWith({
        data: {
          phaseId: 'phase-1',
          teamId: 'team-1',
          groupId: 'group-a',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getStandingsByPhase', () => {
    it('should return standings sorted by position', async () => {
      const mockStandings = [
        {
          id: 'standing-1',
          phaseId: 'phase-1',
          teamId: 'team-1',
          position: 1,
          points: 9,
          played: 3,
          wins: 3,
          team: { id: 'team-1', name: 'Team 1', icon: null },
        },
        {
          id: 'standing-2',
          phaseId: 'phase-1',
          teamId: 'team-2',
          position: 2,
          points: 6,
          played: 3,
          wins: 2,
          team: { id: 'team-2', name: 'Team 2', icon: null },
        },
      ];

      vi.mocked(mockPrisma.leagueStanding.findMany).mockResolvedValue(mockStandings as any);

      await service.getStandingsByPhase('phase-1');

      expect(mockPrisma.leagueStanding.findMany).toHaveBeenCalledWith({
        where: {
          phaseId: 'phase-1',
          groupId: undefined,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
        orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
      });
    });

    it('should filter by group when groupId provided', async () => {
      const mockStandings = [
        {
          id: 'standing-1',
          phaseId: 'phase-1',
          groupId: 'group-a',
          position: 1,
        },
      ];

      vi.mocked(mockPrisma.leagueStanding.findMany).mockResolvedValue(mockStandings as any);

      await service.getStandingsByPhase('phase-1', 'group-a');

      expect(mockPrisma.leagueStanding.findMany).toHaveBeenCalledWith({
        where: { phaseId: 'phase-1', groupId: 'group-a' },
        orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
        include: expect.any(Object),
      });
    });
  });

  describe('processMatchResult', () => {
    it('should update standings for a home win', async () => {
      const matchResult = {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 3,
        awayScore: 1,
        homeYellowCards: 2,
        awayYellowCards: 1,
        homeRedCards: 0,
        awayRedCards: 0,
      };

      const homeStanding = {
        id: 'standing-1',
        teamId: 'team-1',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winsHome: 0,
        winsAway: 0,
        goalsHome: 0,
        goalsAway: 0,
        yellowCards: 0,
        redCards: 0,
      };

      const awayStanding = {
        id: 'standing-2',
        teamId: 'team-2',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winsHome: 0,
        winsAway: 0,
        goalsHome: 0,
        goalsAway: 0,
        yellowCards: 0,
        redCards: 0,
      };

      vi.mocked(mockPrisma.leagueStanding.findFirst)
        .mockResolvedValueOnce(homeStanding as any)
        .mockResolvedValueOnce(awayStanding as any);
      vi.mocked(mockPrisma.leagueStanding.update)
        .mockResolvedValueOnce({ ...homeStanding, team: {} } as any)
        .mockResolvedValueOnce({ ...awayStanding, team: {} } as any);

      await service.processMatchResult('phase-1', matchResult);

      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledTimes(2);

      // Verifica atualização do time da casa (vitória)
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-1' },
        data: {
          played: { increment: 1 },
          wins: { increment: 1 },
          draws: undefined,
          losses: undefined,
          goalsFor: { increment: 3 },
          goalsAgainst: { increment: 1 },
          goalDifference: { increment: 2 },
          points: { increment: 3 },
          winsHome: { increment: 1 },
          winsAway: undefined,
          goalsHome: { increment: 3 },
          goalsAway: undefined,
          yellowCards: { increment: 2 },
          redCards: undefined,
        },
        include: expect.any(Object),
      });

      // Verifica atualização do time visitante (derrota)
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-2' },
        data: {
          played: { increment: 1 },
          wins: undefined,
          draws: undefined,
          losses: { increment: 1 },
          goalsFor: { increment: 1 },
          goalsAgainst: { increment: 3 },
          goalDifference: { increment: -2 },
          points: { increment: 0 },
          winsHome: undefined,
          winsAway: undefined,
          goalsHome: undefined,
          goalsAway: { increment: 1 },
          yellowCards: { increment: 1 },
          redCards: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should update standings for a draw', async () => {
      const matchResult = {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 2,
        awayScore: 2,
        homeYellowCards: 1,
        awayYellowCards: 1,
        homeRedCards: 0,
        awayRedCards: 0,
      };

      const homeStanding = {
        id: 'standing-1',
        teamId: 'team-1',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winsHome: 0,
        winsAway: 0,
        goalsHome: 0,
        goalsAway: 0,
        yellowCards: 0,
        redCards: 0,
      };

      const awayStanding = {
        id: 'standing-2',
        teamId: 'team-2',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winsHome: 0,
        winsAway: 0,
        goalsHome: 0,
        goalsAway: 0,
        yellowCards: 0,
        redCards: 0,
      };

      vi.mocked(mockPrisma.leagueStanding.findFirst)
        .mockResolvedValueOnce(homeStanding as any)
        .mockResolvedValueOnce(awayStanding as any);
      vi.mocked(mockPrisma.leagueStanding.update)
        .mockResolvedValueOnce({ ...homeStanding, team: {} } as any)
        .mockResolvedValueOnce({ ...awayStanding, team: {} } as any);

      await service.processMatchResult('phase-1', matchResult);

      // Ambos os times devem ter empate e 1 ponto
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-1' },
        data: expect.objectContaining({
          played: { increment: 1 },
          draws: { increment: 1 },
          points: { increment: 1 },
        }),
        include: expect.any(Object),
      });

      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-2' },
        data: expect.objectContaining({
          played: { increment: 1 },
          draws: { increment: 1 },
          points: { increment: 1 },
        }),
        include: expect.any(Object),
      });
    });

    it('should update standings for an away win', async () => {
      const matchResult = {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 0,
        awayScore: 2,
        homeYellowCards: 3,
        awayYellowCards: 0,
        homeRedCards: 1,
        awayRedCards: 0,
      };

      const standings = [
        {
          id: 'standing-1',
          teamId: 'team-1',
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winsHome: 0,
          winsAway: 0,
          goalsHome: 0,
          goalsAway: 0,
          yellowCards: 0,
          redCards: 0,
        },
        {
          id: 'standing-2',
          teamId: 'team-2',
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winsHome: 0,
          winsAway: 0,
          goalsHome: 0,
          goalsAway: 0,
          yellowCards: 0,
          redCards: 0,
        },
      ];

      vi.mocked(mockPrisma.leagueStanding.findFirst)
        .mockResolvedValueOnce(standings[0] as any)
        .mockResolvedValueOnce(standings[1] as any);
      vi.mocked(mockPrisma.leagueStanding.update)
        .mockResolvedValueOnce({ ...standings[0], team: {} } as any)
        .mockResolvedValueOnce({ ...standings[1], team: {} } as any);

      await service.processMatchResult('phase-1', matchResult);

      // Time da casa perde
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-1' },
        data: expect.objectContaining({
          played: { increment: 1 },
          losses: { increment: 1 },
          points: { increment: 0 },
          yellowCards: { increment: 3 },
          redCards: { increment: 1 },
        }),
        include: expect.any(Object),
      });

      // Time visitante vence
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-2' },
        data: expect.objectContaining({
          played: { increment: 1 },
          wins: { increment: 1 },
          points: { increment: 3 },
          winsAway: { increment: 1 },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('recalculatePositions', () => {
    it('should reorder standings by points and goal difference', async () => {
      const mockStandings = [
        { id: '1', teamId: 'team-1', points: 9, goalDifference: 5, goalsFor: 10, position: 1 },
        { id: '2', teamId: 'team-2', points: 9, goalDifference: 3, goalsFor: 8, position: 2 },
        { id: '3', teamId: 'team-3', points: 6, goalDifference: 2, goalsFor: 7, position: 3 },
      ];

      vi.mocked(mockPrisma.leagueStanding.findMany).mockResolvedValue(mockStandings as any);
      vi.mocked(mockPrisma.leagueStanding.update).mockResolvedValue({} as any);

      await service.recalculatePositions('phase-1');

      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledTimes(3);

      // Verifica que as posições foram atualizadas
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { position: 1 },
      });
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: { position: 2 },
      });
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: '3' },
        data: { position: 3 },
      });
    });
  });

  describe('deleteStandingsByPhase', () => {
    it('should delete all standings for a phase', async () => {
      vi.mocked(mockPrisma.leagueStanding.deleteMany).mockResolvedValue({ count: 5 } as any);

      await service.deleteStandingsByPhase('phase-1');

      expect(mockPrisma.leagueStanding.deleteMany).toHaveBeenCalledWith({
        where: { phaseId: 'phase-1' },
      });
    });
  });

  describe('updateStanding', () => {
    it('should update specific standing fields', async () => {
      const updatedStanding = {
        id: 'standing-1',
        wins: 6,
        draws: 2,
        losses: 1,
        played: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        winsHome: 0,
        winsAway: 0,
        goalsHome: 0,
        goalsAway: 0,
        yellowCards: 0,
        redCards: 0,
        phaseId: 'phase-1',
        teamId: 'team-1',
        groupId: null,
        position: null,
        team: { id: 'team-1', name: 'Team 1', icon: null },
      };

      vi.mocked(mockPrisma.leagueStanding.update).mockResolvedValue(updatedStanding as any);

      const result = await service.updateStanding('standing-1', { wins: 6, draws: 2, losses: 1 });

      expect(result.wins).toBe(6);
      expect(mockPrisma.leagueStanding.update).toHaveBeenCalledWith({
        where: { id: 'standing-1' },
        data: {
          wins: 6,
          draws: 2,
          losses: 1,
          goalsFor: undefined,
          goalsAgainst: undefined,
          goalDifference: undefined,
          points: expect.any(Number),
          yellowCards: undefined,
          redCards: undefined,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      });
    });
  });
});
