/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient, DisciplineRule } from '@prisma/client';

import { DisciplineRuleService } from './discipline-rule.service.js';

// Mock do Prisma Client
const mockPrisma = {
  disciplineRule: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  league: {
    findUnique: vi.fn(),
  },
  leaguePhase: {
    findMany: vi.fn(),
  },
  playersOnTeams: {
    findMany: vi.fn(),
  },
  leagueStanding: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('DisciplineRuleService', () => {
  let service: DisciplineRuleService;

  beforeEach(() => {
    service = new DisciplineRuleService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('createRules', () => {
    it('should create discipline rules with default values', async () => {
      const ruleData = {
        leagueId: 'league-1',
      };

      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague = { id: 'league-1', name: 'Test League' };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(mockLeague as any);
      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.disciplineRule.create).mockResolvedValue(mockRule);

      const result = await service.createRules(ruleData);

      expect(result.yellowCardsForSuspension).toBe(3);
      expect(result.yellowCardsAccumulation).toBe(true);
      expect(result.resetYellowsAfterPhaseOrder).toBeNull();
      expect(result.redCardMinimumGames).toBe(1);
      expect(result.doubleYellowGames).toBe(1);
    });

    it('should create rules with reset phase configuration', async () => {
      const ruleData = {
        leagueId: 'league-1',
        yellowCardsForSuspension: 2,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: 4,
        redCardMinimumGames: 2,
        doubleYellowGames: 1,
      };

      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 2,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: 4,
        redCardMinimumGames: 2,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague = { id: 'league-1', name: 'Test League' };

      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(mockLeague as any);
      vi.mocked(mockPrisma.disciplineRule.create).mockResolvedValue(mockRule);

      const result = await service.createRules(ruleData);

      expect(result.resetYellowsAfterPhaseOrder).toBe(4);
    });

    it('should throw error if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      await expect(
        service.createRules({
          leagueId: 'non-existent',
          yellowCardsForSuspension: 3,
          yellowCardsAccumulation: true,
          redCardMinimumGames: 1,
          doubleYellowGames: 1,
        }),
      ).rejects.toThrow('Liga não encontrada');
    });
  });

  describe('getRulesByLeagueId', () => {
    it('should return rules for a league', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(mockRule);

      const result = await service.getRulesByLeagueId('league-1');

      expect(result).toEqual(mockRule);
      expect(mockPrisma.disciplineRule.findUnique).toHaveBeenCalledWith({
        where: { leagueId: 'league-1' },
      });
    });

    it('should return null if no rules exist', async () => {
      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(null);

      const result = await service.getRulesByLeagueId('league-1');

      expect(result).toBeNull();
    });
  });

  describe('updateRules', () => {
    it('should update existing rules', async () => {
      const existingRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRule: DisciplineRule = {
        ...existingRule,
        yellowCardsForSuspension: 2,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: 4,
      };

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(existingRule);
      vi.mocked(mockPrisma.disciplineRule.update).mockResolvedValue(updatedRule);

      const result = await service.updateRules('league-1', {
        yellowCardsForSuspension: 2,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: 4,
      });

      expect(result).toEqual(updatedRule);
      expect(mockPrisma.disciplineRule.update).toHaveBeenCalledWith({
        where: { leagueId: 'league-1' },
        data: {
          yellowCardsForSuspension: 2,
          yellowCardsAccumulation: true,
          resetYellowsAfterPhaseOrder: 4,
          redCardMinimumGames: undefined,
          doubleYellowGames: undefined,
        },
      });
    });
  });

  describe('checkPlayerSuspension', () => {
    it('should detect suspension when yellow cards exceed limit', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPhases = [{ id: 'phase-1' }];
      const mockPlayerTeams = [{ teamId: 'team-1' }];
      const mockStandings = [
        { yellowCards: 2, redCards: 0 },
        { yellowCards: 1, redCards: 0 },
      ];

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(mockRule);
      vi.mocked(mockPrisma.leaguePhase.findMany).mockResolvedValue(mockPhases as any);
      vi.mocked(mockPrisma.playersOnTeams.findMany).mockResolvedValue(mockPlayerTeams as any);
      vi.mocked(mockPrisma.leagueStanding.findMany).mockResolvedValue(mockStandings as any);

      const result = await service.checkPlayerSuspension('player-1', 'league-1');

      expect(result.isSuspended).toBe(true);
      expect(result.reason).toBe('Acúmulo de cartões amarelos');
      expect(result.yellowCardsCount).toBe(3);
      expect(result.suspensionGames).toBe(1);
    });

    it('should not detect suspension when below yellow card limit', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPhases = [{ id: 'phase-1' }];
      const mockPlayerTeams = [{ teamId: 'team-1' }];
      const mockStandings = [{ yellowCards: 2, redCards: 0 }];

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(mockRule);
      vi.mocked(mockPrisma.leaguePhase.findMany).mockResolvedValue(mockPhases as any);
      vi.mocked(mockPrisma.playersOnTeams.findMany).mockResolvedValue(mockPlayerTeams as any);
      vi.mocked(mockPrisma.leagueStanding.findMany).mockResolvedValue(mockStandings as any);

      const result = await service.checkPlayerSuspension('player-1', 'league-1');

      expect(result.isSuspended).toBe(false);
      expect(result.yellowCardsCount).toBe(2);
    });

    it('should return not suspended if no rules configured', async () => {
      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(null);

      const result = await service.checkPlayerSuspension('player-1', 'league-1');

      expect(result.isSuspended).toBe(false);
    });
  });

  describe('resetYellowCardsAfterPhase', () => {
    it('should reset yellow cards after specified phase', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: 4,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPhases = [
        { id: 'phase-1' },
        { id: 'phase-2' },
        { id: 'phase-3' },
        { id: 'phase-4' },
      ];

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(mockRule);
      vi.mocked(mockPrisma.leaguePhase.findMany).mockResolvedValue(mockPhases as any);
      vi.mocked(mockPrisma.leagueStanding.updateMany).mockResolvedValue({ count: 10 } as any);

      const result = await service.resetYellowCardsAfterPhase('league-1', 4);

      expect(result).toBe(10);
      expect(mockPrisma.leagueStanding.updateMany).toHaveBeenCalledWith({
        where: {
          phaseId: { in: ['phase-1', 'phase-2', 'phase-3', 'phase-4'] },
        },
        data: {
          yellowCards: 0,
        },
      });
    });

    it('should return 0 if no reset configured', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.disciplineRule.findUnique).mockResolvedValue(mockRule);

      const result = await service.resetYellowCardsAfterPhase('league-1', 4);

      expect(result).toBe(0);
    });
  });

  describe('deleteRules', () => {
    it('should delete discipline rules', async () => {
      const mockRule: DisciplineRule = {
        id: 'rule-1',
        leagueId: 'league-1',
        yellowCardsForSuspension: 3,
        yellowCardsAccumulation: true,
        resetYellowsAfterPhaseOrder: null,
        redCardMinimumGames: 1,
        doubleYellowGames: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.disciplineRule.delete).mockResolvedValue(mockRule);

      await service.deleteRules('league-1');

      expect(mockPrisma.disciplineRule.delete).toHaveBeenCalledWith({
        where: { leagueId: 'league-1' },
      });
    });
  });
});
