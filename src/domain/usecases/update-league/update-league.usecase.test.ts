import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateLeagueUseCase } from './update-league.usecase.js';
import type { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { League } from '../../entities/league.entity.js';

describe('UpdateLeagueUseCase', () => {
  let useCase: UpdateLeagueUseCase;
  let mockLeagueRepository: ILeagueRepository;

  beforeEach(() => {
    mockLeagueRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      list: vi.fn(),
      listByTeamIds: vi.fn(),
      listByTeamIdsEnriched: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      exists: vi.fn(),
      findByIdWithDetails: vi.fn(),
    } as unknown as ILeagueRepository;

    useCase = new UpdateLeagueUseCase(mockLeagueRepository);
  });

  describe('execute', () => {
    it('should update league maintaining existing matchFormat', async () => {
      const leagueId = 'league-1';
      const input = {
        leagueId,
        name: 'Liga Atualizada',
      };

      const existingLeague = new League(
        leagueId,
        'Liga Antiga',
        'liga-antiga',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      const updatedLeague = new League(
        leagueId,
        'Liga Atualizada',
        'liga-antiga',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(existingLeague);
      vi.mocked(mockLeagueRepository.update).mockResolvedValue(updatedLeague);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        id: leagueId,
        name: 'Liga Atualizada',
        slug: 'liga-antiga',
        matchFormat: 'FUT11',
      });

      expect(mockLeagueRepository.update).toHaveBeenCalledWith(leagueId, {
        name: 'Liga Atualizada',
        slug: undefined,
        description: undefined,
        startAt: undefined,
        endAt: undefined,
        isActive: undefined,
        icon: undefined,
        banner: undefined,
        matchFormat: undefined,
      });
    });

    it('should update league matchFormat from FUT11 to FUTSAL', async () => {
      const leagueId = 'league-2';
      const input = {
        leagueId,
        matchFormat: 'FUTSAL' as const,
      };

      const existingLeague = new League(
        leagueId,
        'Liga Teste',
        'liga-teste',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      const updatedLeague = new League(
        leagueId,
        'Liga Teste',
        'liga-teste',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUTSAL',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(existingLeague);
      vi.mocked(mockLeagueRepository.update).mockResolvedValue(updatedLeague);

      const result = await useCase.execute(input);

      expect(result.matchFormat).toBe('FUTSAL');
      expect(mockLeagueRepository.update).toHaveBeenCalledWith(
        leagueId,
        expect.objectContaining({
          matchFormat: 'FUTSAL',
        }),
      );
    });

    it('should update league matchFormat to FUT7', async () => {
      const leagueId = 'league-3';
      const input = {
        leagueId,
        matchFormat: 'FUT7' as const,
        name: 'Liga FUT7',
      };

      const existingLeague = new League(
        leagueId,
        'Liga Antiga',
        'liga-antiga',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      const updatedLeague = new League(
        leagueId,
        'Liga FUT7',
        'liga-antiga',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT7',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(existingLeague);
      vi.mocked(mockLeagueRepository.update).mockResolvedValue(updatedLeague);

      const result = await useCase.execute(input);

      expect(result.matchFormat).toBe('FUT7');
    });

    it('should throw error when league not found', async () => {
      const input = {
        leagueId: 'non-existent',
        name: 'Liga Teste',
      };

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('LEAGUE_NOT_FOUND');
      expect(mockLeagueRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when slug already exists', async () => {
      const leagueId = 'league-1';
      const input = {
        leagueId,
        slug: 'slug-existente',
      };

      const existingLeague = new League(
        leagueId,
        'Liga Teste',
        'liga-teste',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      const otherLeague = new League(
        'other-league',
        'Outra Liga',
        'slug-existente',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(existingLeague);
      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(otherLeague);

      await expect(useCase.execute(input)).rejects.toThrow('SLUG_ALREADY_EXISTS');
      expect(mockLeagueRepository.update).not.toHaveBeenCalled();
    });

    it('should update league with all fields', async () => {
      const leagueId = 'league-4';
      const startAt = new Date('2024-01-01');
      const endAt = new Date('2024-12-31');

      const input = {
        leagueId,
        name: 'Liga Completa Atualizada',
        slug: 'liga-completa-atualizada',
        description: 'Descrição atualizada',
        icon: 'new-icon.png',
        banner: 'new-banner.jpg',
        startAt,
        endAt,
        isActive: false,
        matchFormat: 'FUTSAL' as const,
      };

      const existingLeague = new League(
        leagueId,
        'Liga Antiga',
        'liga-antiga',
        null,
        null,
        null,
        null,
        null,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      const updatedLeague = new League(
        leagueId,
        'Liga Completa Atualizada',
        'liga-completa-atualizada',
        'Descrição atualizada',
        'new-icon.png',
        'new-banner.jpg',
        startAt,
        endAt,
        false,
        false,
        'FUTSAL',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(existingLeague);
      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockLeagueRepository.update).mockResolvedValue(updatedLeague);

      const result = await useCase.execute(input);

      expect(mockLeagueRepository.update).toHaveBeenCalledWith(leagueId, {
        name: 'Liga Completa Atualizada',
        slug: 'liga-completa-atualizada',
        description: 'Descrição atualizada',
        icon: 'new-icon.png',
        banner: 'new-banner.jpg',
        startAt,
        endAt,
        isActive: false,
        matchFormat: 'FUTSAL',
      });

      expect(result).toEqual({
        id: leagueId,
        name: 'Liga Completa Atualizada',
        slug: 'liga-completa-atualizada',
        matchFormat: 'FUTSAL',
      });
    });
  });
});
