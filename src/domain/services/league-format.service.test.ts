/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { LeagueFormatType, PhaseType, TiebreakCriterion } from '@prisma/client';

import { LeagueFormatService } from './league-format.service.js';

// Mock do Prisma Client
const mockPrisma = {
  leagueFormat: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  league: {
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  leaguePhase: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

describe('LeagueFormatService', () => {
  let service: LeagueFormatService;

  beforeEach(() => {
    service = new LeagueFormatService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('createFormat', () => {
    it('should create a format with phases and tiebreak rules', async () => {
      const formatData = {
        name: 'Copa do Brasil',
        slug: 'copa-do-brasil',
        type: LeagueFormatType.KNOCKOUT,
        description: 'Formato mata-mata',
        isTemplate: true,
        phases: [
          {
            name: 'Oitavas',
            order: 1,
            type: PhaseType.KNOCKOUT,
            teamsCount: 16,
            hasHomeAway: true,
            hasPenalties: true,
            advancingTeams: 8,
            tiebreakRules: [{ order: 1, criterion: TiebreakCriterion.GOAL_DIFFERENCE }],
          },
        ],
      };

      const mockFormat = {
        id: 'format-1',
        name: 'Copa do Brasil',
        slug: 'copa-do-brasil',
        type: LeagueFormatType.KNOCKOUT,
        description: 'Formato mata-mata',
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phases: [
          {
            id: 'phase-1',
            name: 'Oitavas',
            order: 1,
            type: PhaseType.KNOCKOUT,
            teamsCount: 16,
            groupsCount: null,
            teamsPerGroup: null,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 8,
            advancingFrom: null,
            tiebreakRules: [{ order: 1, criterion: TiebreakCriterion.GOAL_DIFFERENCE }],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.leagueFormat.create).mockResolvedValue(mockFormat as any);

      const result = await service.createFormat(formatData);

      expect(result).toEqual(mockFormat);
      expect(mockPrisma.leagueFormat.findUnique).toHaveBeenCalledWith({
        where: { slug: 'copa-do-brasil' },
      });
    });

    it('should throw error if slug already exists', async () => {
      const formatData = {
        name: 'Copa do Brasil',
        slug: 'copa-do-brasil',
        type: LeagueFormatType.KNOCKOUT,
        phases: [
          {
            name: 'Final',
            order: 1,
            type: PhaseType.KNOCKOUT,
            tiebreakRules: [],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue({
        id: 'existing',
        slug: 'copa-do-brasil',
      } as any);

      await expect(service.createFormat(formatData)).rejects.toThrow(
        'Formato com este slug já existe',
      );
    });

    it('should validate sequential phase ordering', async () => {
      const formatData = {
        name: 'Invalid Format',
        slug: 'invalid',
        type: LeagueFormatType.MIXED,
        phases: [
          {
            name: 'Phase 1',
            order: 1,
            type: PhaseType.GROUP_STAGE,
            tiebreakRules: [],
          },
          {
            name: 'Phase 3',
            order: 3,
            type: PhaseType.KNOCKOUT,
            tiebreakRules: [],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(null);

      await expect(service.createFormat(formatData)).rejects.toThrow(
        'Ordens das fases devem ser sequenciais começando de 1',
      );
    });

    it('should validate group stage has groupsCount', async () => {
      const formatData = {
        name: 'Invalid Group Format',
        slug: 'invalid-group',
        type: LeagueFormatType.MIXED,
        phases: [
          {
            name: 'Grupos',
            order: 1,
            type: PhaseType.GROUP_STAGE,
            groupsCount: undefined,
            tiebreakRules: [],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(null);

      await expect(service.createFormat(formatData)).rejects.toThrow(
        'Fase de grupos requer groupsCount e teamsPerGroup',
      );
    });
  });

  describe('getFormatById', () => {
    it('should return format with all relations', async () => {
      const mockFormat = {
        id: 'format-1',
        name: 'Brasileirão',
        slug: 'brasileirao',
        type: LeagueFormatType.ROUND_ROBIN,
        description: null,
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phases: [
          {
            id: 'phase-1',
            name: 'Pontos Corridos',
            order: 1,
            type: PhaseType.LEAGUE,
            teamsCount: null,
            groupsCount: null,
            teamsPerGroup: null,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: null,
            advancingFrom: null,
            tiebreakRules: [{ order: 1, criterion: TiebreakCriterion.POINTS }],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(mockFormat as any);

      const result = await service.getFormatById('format-1');

      expect(result).toEqual(mockFormat);
      expect(mockPrisma.leagueFormat.findUnique).toHaveBeenCalledWith({
        where: { id: 'format-1' },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            include: {
              tiebreakRules: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
    });

    it('should return null if format not found', async () => {
      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(null);

      const result = await service.getFormatById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getFormatBySlug', () => {
    it('should return format by slug', async () => {
      const mockFormat = {
        id: 'format-1',
        slug: 'libertadores',
        name: 'Libertadores',
        type: LeagueFormatType.MIXED,
        description: null,
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phases: [],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(mockFormat as any);

      const result = await service.getFormatBySlug('libertadores');

      expect(result).toEqual(mockFormat);
      expect(mockPrisma.leagueFormat.findUnique).toHaveBeenCalledWith({
        where: { slug: 'libertadores' },
        include: expect.any(Object),
      });
    });
  });

  describe('listFormats', () => {
    it('should list all formats when templatesOnly is false', async () => {
      const mockFormats = [
        { id: '1', name: 'Format 1', isTemplate: true, phases: [] },
        { id: '2', name: 'Format 2', isTemplate: false, phases: [] },
      ];

      vi.mocked(mockPrisma.leagueFormat.findMany).mockResolvedValue(mockFormats as any);

      await service.listFormats(false);

      expect(mockPrisma.leagueFormat.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should list only templates when templatesOnly is true', async () => {
      const mockFormats = [{ id: '1', name: 'Template 1', isTemplate: true, phases: [] }];

      vi.mocked(mockPrisma.leagueFormat.findMany).mockResolvedValue(mockFormats as any);

      const result = await service.listFormats(true);

      expect(result).toEqual(mockFormats);
      expect(mockPrisma.leagueFormat.findMany).toHaveBeenCalledWith({
        where: { isTemplate: true },
        orderBy: { name: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('updateFormat', () => {
    it('should update format metadata', async () => {
      const updatedFormat = {
        id: 'format-1',
        name: 'New Name',
        slug: 'old-slug',
        phases: [],
      };

      vi.mocked(mockPrisma.leagueFormat.update).mockResolvedValue(updatedFormat as any);

      await service.updateFormat('format-1', {
        name: 'New Name',
        description: 'Updated description',
      });

      expect(mockPrisma.leagueFormat.update).toHaveBeenCalled();
    });
  });

  describe('deleteFormat', () => {
    it('should delete format if not in use', async () => {
      const mockFormat = { id: 'format-1', name: 'Format 1' };

      vi.mocked(mockPrisma.league.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.leagueFormat.delete).mockResolvedValue(mockFormat as any);

      await service.deleteFormat('format-1');

      expect(mockPrisma.league.count).toHaveBeenCalledWith({
        where: { formatId: 'format-1' },
      });
      expect(mockPrisma.leagueFormat.delete).toHaveBeenCalledWith({
        where: { id: 'format-1' },
      });
    });

    it('should throw error if format is in use', async () => {
      vi.mocked(mockPrisma.league.count).mockResolvedValue(2);

      await expect(service.deleteFormat('format-1')).rejects.toThrow(
        'Formato está sendo usado por 2 liga(s) e não pode ser deletado',
      );
    });
  });

  describe('applyFormatToLeague', () => {
    it('should apply format to league and create phases', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'My League',
        formatId: null,
      };

      const mockFormat = {
        id: 'format-1',
        name: 'Copa Format',
        slug: 'copa-format',
        type: LeagueFormatType.KNOCKOUT,
        description: null,
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phases: [
          {
            id: 'phase-config-1',
            name: 'Oitavas',
            order: 1,
            type: PhaseType.KNOCKOUT,
            teamsCount: null,
            groupsCount: null,
            teamsPerGroup: null,
            hasHomeAway: true,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: null,
            advancingFrom: null,
            tiebreakRules: [],
          },
        ],
      };

      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(mockFormat as any);
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(mockLeague as any);
      vi.mocked(mockPrisma.league.update).mockResolvedValue({
        ...mockLeague,
        formatId: 'format-1',
      } as any);
      vi.mocked(mockPrisma.leaguePhase.create).mockResolvedValue({} as any);

      await service.applyFormatToLeague('league-1', 'format-1');

      expect(mockPrisma.league.update).toHaveBeenCalledWith({
        where: { id: 'league-1' },
        data: { formatId: 'format-1' },
      });
      expect(mockPrisma.leaguePhase.create).toHaveBeenCalled();
    });

    it('should throw error if league not found', async () => {
      vi.mocked(mockPrisma.league.findUnique).mockResolvedValue(null);

      await expect(service.applyFormatToLeague('non-existent', 'format-1')).rejects.toThrow(
        'Liga não encontrada',
      );
    });

    it('should throw error if format not found', async () => {
      vi.mocked(mockPrisma.leagueFormat.findUnique).mockResolvedValue(null);

      await expect(service.applyFormatToLeague('league-1', 'non-existent')).rejects.toThrow(
        'Formato não encontrado',
      );
    });
  });
});
