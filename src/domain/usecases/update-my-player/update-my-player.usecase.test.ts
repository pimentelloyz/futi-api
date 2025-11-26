import { describe, it, expect, vi } from 'vitest';
import {
  UpdateMyPlayerUseCase,
  PlayerNotFoundError,
  InvalidPositionError,
} from './update-my-player.usecase.js';
import { PlayerRepository } from '../../../data/protocols/player-repository.js';

describe('UpdateMyPlayerUseCase', () => {
  const mockPlayerRepository: PlayerRepository = {
    add: vi.fn(),
    addForUser: vi.fn(),
    findByUserId: vi.fn(),
    update: vi.fn(),
  };

  it('should update player name successfully', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Old Name',
      photo: null,
      positionSlug: 'goleiro',
      position: { slug: 'goleiro', name: 'Goleiro', description: null },
      number: 1,
      isActive: true,
    };

    const mockUpdated = {
      ...mockPlayer,
      name: 'New Name',
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockResolvedValue(mockUpdated);

    const result = await useCase.execute({
      userId: 'user-123',
      name: 'New Name',
    });

    expect(result.name).toBe('New Name');
    expect(mockPlayerRepository.findByUserId).toHaveBeenCalledWith('user-123');
    expect(mockPlayerRepository.update).toHaveBeenCalledWith('player-123', { name: 'New Name' });
  });

  it('should update player number successfully', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Player Name',
      photo: null,
      positionSlug: 'atacante',
      position: { slug: 'atacante', name: 'Atacante', description: null },
      number: 10,
      isActive: true,
    };

    const mockUpdated = {
      ...mockPlayer,
      number: 99,
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockResolvedValue(mockUpdated);

    const result = await useCase.execute({
      userId: 'user-123',
      number: 99,
    });

    expect(result.number).toBe(99);
    expect(mockPlayerRepository.update).toHaveBeenCalledWith('player-123', { number: 99 });
  });

  it('should update player position successfully', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Player Name',
      photo: null,
      positionSlug: 'goleiro',
      position: { slug: 'goleiro', name: 'Goleiro', description: null },
      number: 1,
      isActive: true,
    };

    const mockUpdated = {
      ...mockPlayer,
      positionSlug: 'zagueiro',
      position: { slug: 'zagueiro', name: 'Zagueiro', description: null },
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockResolvedValue(mockUpdated);

    const result = await useCase.execute({
      userId: 'user-123',
      positionSlug: 'zagueiro',
    });

    expect(result.positionSlug).toBe('zagueiro');
    expect(result.position?.slug).toBe('zagueiro');
    expect(mockPlayerRepository.update).toHaveBeenCalledWith('player-123', {
      positionSlug: 'zagueiro',
    });
  });

  it('should set position to null when provided', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Player Name',
      photo: null,
      positionSlug: 'goleiro',
      position: { slug: 'goleiro', name: 'Goleiro', description: null },
      number: 1,
      isActive: true,
    };

    const mockUpdated = {
      ...mockPlayer,
      positionSlug: null,
      position: null,
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockResolvedValue(mockUpdated);

    const result = await useCase.execute({
      userId: 'user-123',
      positionSlug: null,
    });

    expect(result.positionSlug).toBeNull();
    expect(result.position).toBeNull();
    expect(mockPlayerRepository.update).toHaveBeenCalledWith('player-123', {
      positionSlug: null,
    });
  });

  it('should throw PlayerNotFoundError when user has no player', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-456',
        name: 'Some Name',
      }),
    ).rejects.toThrow(PlayerNotFoundError);
  });

  it('should throw InvalidPositionError when positionSlug is invalid', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Player Name',
      photo: null,
      positionSlug: 'goleiro',
      position: { slug: 'goleiro', name: 'Goleiro', description: null },
      number: 1,
      isActive: true,
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockRejectedValue(
      new Error('Foreign key constraint failed on relation'),
    );

    await expect(
      useCase.execute({
        userId: 'user-123',
        positionSlug: 'invalid-position',
      }),
    ).rejects.toThrow(InvalidPositionError);
  });

  it('should update multiple fields at once', async () => {
    const useCase = new UpdateMyPlayerUseCase(mockPlayerRepository);

    const mockPlayer = {
      id: 'player-123',
      name: 'Old Name',
      photo: 'photo.jpg',
      positionSlug: 'goleiro',
      position: { slug: 'goleiro', name: 'Goleiro', description: null },
      number: 1,
      isActive: true,
    };

    const mockUpdated = {
      ...mockPlayer,
      name: 'New Name',
      number: 10,
      positionSlug: 'atacante',
      position: { slug: 'atacante', name: 'Atacante', description: null },
    };

    vi.mocked(mockPlayerRepository.findByUserId).mockResolvedValue(mockPlayer);
    vi.mocked(mockPlayerRepository.update).mockResolvedValue(mockUpdated);

    const result = await useCase.execute({
      userId: 'user-123',
      name: 'New Name',
      number: 10,
      positionSlug: 'atacante',
    });

    expect(result.name).toBe('New Name');
    expect(result.number).toBe(10);
    expect(result.positionSlug).toBe('atacante');
    expect(mockPlayerRepository.update).toHaveBeenCalledWith('player-123', {
      name: 'New Name',
      number: 10,
      positionSlug: 'atacante',
    });
  });
});
