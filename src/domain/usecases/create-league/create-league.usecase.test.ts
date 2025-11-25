import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateLeagueUseCase } from './create-league.usecase.js';
import type { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { League } from '../../entities/league.entity.js';

describe('CreateLeagueUseCase', () => {
  let useCase: CreateLeagueUseCase;
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

    useCase = new CreateLeagueUseCase(mockLeagueRepository);
  });

  describe('execute', () => {
    it('should create a league with FUT11 format by default', async () => {
      const input = {
        name: 'Liga Teste',
        slug: 'liga-teste',
        description: 'Uma liga de teste',
        isPublic: true,
      };

      const mockLeague = new League(
        'league-1',
        'Liga Teste',
        'liga-teste',
        'Uma liga de teste',
        null,
        null,
        null,
        null,
        true,
        true,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockLeagueRepository.create).mockResolvedValue(mockLeague);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        id: 'league-1',
        name: 'Liga Teste',
        slug: 'liga-teste',
        matchFormat: 'FUT11',
      });

      expect(mockLeagueRepository.findBySlug).toHaveBeenCalledWith('liga-teste');
      expect(mockLeagueRepository.create).toHaveBeenCalledWith({
        name: 'Liga Teste',
        slug: 'liga-teste',
        description: 'Uma liga de teste',
        icon: undefined,
        banner: undefined,
        startAt: undefined,
        endAt: undefined,
        isPublic: true,
        matchFormat: 'FUT11',
      });
    });

    it('should create a league with FUTSAL format', async () => {
      const input = {
        name: 'Liga Futsal',
        slug: 'liga-futsal',
        matchFormat: 'FUTSAL' as const,
      };

      const mockLeague = new League(
        'league-2',
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

      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockLeagueRepository.create).mockResolvedValue(mockLeague);

      const result = await useCase.execute(input);

      expect(result.matchFormat).toBe('FUTSAL');
      expect(mockLeagueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          matchFormat: 'FUTSAL',
        }),
      );
    });

    it('should create a league with FUT7 format', async () => {
      const input = {
        name: 'Liga FUT7',
        slug: 'liga-fut7',
        matchFormat: 'FUT7' as const,
      };

      const mockLeague = new League(
        'league-3',
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

      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockLeagueRepository.create).mockResolvedValue(mockLeague);

      const result = await useCase.execute(input);

      expect(result.matchFormat).toBe('FUT7');
      expect(mockLeagueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          matchFormat: 'FUT7',
        }),
      );
    });

    it('should throw error when slug already exists', async () => {
      const input = {
        name: 'Liga Teste',
        slug: 'liga-existente',
      };

      const existingLeague = new League(
        'league-existing',
        'Liga Existente',
        'liga-existente',
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

      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(existingLeague);

      await expect(useCase.execute(input)).rejects.toThrow('SLUG_ALREADY_EXISTS');
      expect(mockLeagueRepository.create).not.toHaveBeenCalled();
    });

    it('should create league with all optional fields', async () => {
      const startAt = new Date('2024-01-01');
      const endAt = new Date('2024-12-31');

      const input = {
        name: 'Liga Completa',
        slug: 'liga-completa',
        description: 'Liga com todos os campos',
        icon: 'icon.png',
        banner: 'banner.jpg',
        startAt,
        endAt,
        isPublic: true,
        matchFormat: 'FUT11' as const,
      };

      const mockLeague = new League(
        'league-4',
        'Liga Completa',
        'liga-completa',
        'Liga com todos os campos',
        'icon.png',
        'banner.jpg',
        startAt,
        endAt,
        true,
        true,
        'FUT11',
        new Date(),
        new Date(),
      );

      vi.mocked(mockLeagueRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockLeagueRepository.create).mockResolvedValue(mockLeague);

      const result = await useCase.execute(input);

      expect(mockLeagueRepository.create).toHaveBeenCalledWith({
        name: 'Liga Completa',
        slug: 'liga-completa',
        description: 'Liga com todos os campos',
        icon: 'icon.png',
        banner: 'banner.jpg',
        startAt,
        endAt,
        isPublic: true,
        matchFormat: 'FUT11',
      });

      expect(result).toEqual({
        id: 'league-4',
        name: 'Liga Completa',
        slug: 'liga-completa',
        matchFormat: 'FUT11',
      });
    });
  });
});
