import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetLeagueUseCase } from './get-league.usecase.js';
import type { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { League } from '../../entities/league.entity.js';

describe('GetLeagueUseCase', () => {
  let useCase: GetLeagueUseCase;
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

    useCase = new GetLeagueUseCase(mockLeagueRepository);
  });

  describe('execute', () => {
    it('should return league with FUT11 matchFormat', async () => {
      const leagueId = 'league-1';
      const startAt = new Date('2024-01-01');
      const endAt = new Date('2024-12-31');

      const mockLeague = new League(
        leagueId,
        'Liga Teste',
        'liga-teste',
        'Descrição da liga',
        'icon.png',
        'banner.jpg',
        startAt,
        endAt,
        true,
        true,
        'FUT11',
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result).toEqual({
        id: leagueId,
        name: 'Liga Teste',
        slug: 'liga-teste',
        description: 'Descrição da liga',
        icon: 'icon.png',
        banner: 'banner.jpg',
        startAt,
        endAt,
        isActive: true,
        isPublic: true,
        isOngoing: expect.any(Boolean),
        matchFormat: 'FUT11',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockLeagueRepository.findById).toHaveBeenCalledWith(leagueId);
    });

    it('should return league with FUTSAL matchFormat', async () => {
      const leagueId = 'league-2';

      const mockLeague = new League(
        leagueId,
        'Liga Futsal',
        'liga-futsal',
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

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result.matchFormat).toBe('FUTSAL');
    });

    it('should return league with FUT7 matchFormat', async () => {
      const leagueId = 'league-3';

      const mockLeague = new League(
        leagueId,
        'Liga FUT7',
        'liga-fut7',
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

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result.matchFormat).toBe('FUT7');
    });

    it('should throw error when league not found', async () => {
      const leagueId = 'non-existent';

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute({ identifier: leagueId })).rejects.toThrow('LEAGUE_NOT_FOUND');
    });

    it('should return isOngoing true when league is active and within dates', async () => {
      const leagueId = 'league-4';
      const now = new Date();
      const startAt = new Date(now.getTime() - 86400000); // 1 day ago
      const endAt = new Date(now.getTime() + 86400000); // 1 day from now

      const mockLeague = new League(
        leagueId,
        'Liga Ativa',
        'liga-ativa',
        null,
        null,
        null,
        startAt,
        endAt,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result.isOngoing).toBe(true);
    });

    it('should return isOngoing false when league has not started yet', async () => {
      const leagueId = 'league-5';
      const now = new Date();
      const startAt = new Date(now.getTime() + 86400000); // 1 day from now
      const endAt = new Date(now.getTime() + 172800000); // 2 days from now

      const mockLeague = new League(
        leagueId,
        'Liga Futura',
        'liga-futura',
        null,
        null,
        null,
        startAt,
        endAt,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result.isOngoing).toBe(false);
    });

    it('should return isOngoing false when league has ended', async () => {
      const leagueId = 'league-6';
      const now = new Date();
      const startAt = new Date(now.getTime() - 172800000); // 2 days ago
      const endAt = new Date(now.getTime() - 86400000); // 1 day ago

      const mockLeague = new League(
        leagueId,
        'Liga Encerrada',
        'liga-encerrada',
        null,
        null,
        null,
        startAt,
        endAt,
        true,
        false,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result.isOngoing).toBe(false);
    });

    it('should return all league properties including matchFormat', async () => {
      const leagueId = 'league-7';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const mockLeague = new League(
        leagueId,
        'Liga Completa',
        'liga-completa',
        'Descrição completa',
        'icon.png',
        'banner.jpg',
        new Date('2024-03-01'),
        new Date('2024-12-31'),
        true,
        true,
        'FUTSAL',
        createdAt,
        updatedAt,
      );

      vi.mocked(mockLeagueRepository.findById).mockResolvedValue(mockLeague);

      const result = await useCase.execute({ identifier: leagueId });

      expect(result).toMatchObject({
        id: leagueId,
        name: 'Liga Completa',
        slug: 'liga-completa',
        description: 'Descrição completa',
        icon: 'icon.png',
        banner: 'banner.jpg',
        isActive: true,
        isPublic: true,
        matchFormat: 'FUTSAL',
        createdAt,
        updatedAt,
      });
    });
  });
});
