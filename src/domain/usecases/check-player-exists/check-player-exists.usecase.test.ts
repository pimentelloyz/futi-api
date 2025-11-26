import { describe, it, expect, beforeEach } from 'vitest';
import { CheckPlayerExistsUseCase } from './check-player-exists.usecase.js';
import type { IPlayerRepository } from '../../repositories/player.repository.interface.js';

describe('CheckPlayerExistsUseCase', () => {
  let useCase: CheckPlayerExistsUseCase;
  let mockRepository: IPlayerRepository;

  beforeEach(() => {
    mockRepository = {
      findByUserId: async () => null,
      addForUser: async () => ({ id: 'player-123' }),
      getTeamIds: async () => [],
      linkToTeam: async () => {},
    };
    useCase = new CheckPlayerExistsUseCase(mockRepository);
  });

  it('should return exists: true when player exists', async () => {
    mockRepository.findByUserId = async () => ({
      id: 'player-123',
      name: 'John Doe',
      positionSlug: null,
      position: null,
      number: null,
      isActive: true,
    });

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.exists).toBe(true);
    expect(result.playerId).toBe('player-123');
  });

  it('should return exists: false when player does not exist', async () => {
    mockRepository.findByUserId = async () => null;

    const result = await useCase.execute({ userId: 'user-456' });

    expect(result.exists).toBe(false);
    expect(result.playerId).toBeUndefined();
  });

  it('should call repository with correct userId', async () => {
    let calledWith: string | undefined;
    mockRepository.findByUserId = async (userId: string) => {
      calledWith = userId;
      return null;
    };

    await useCase.execute({ userId: 'user-789' });

    expect(calledWith).toBe('user-789');
  });
});
