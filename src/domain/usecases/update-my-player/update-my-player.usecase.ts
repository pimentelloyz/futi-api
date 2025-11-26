import { PlayerRepository } from '../../../data/protocols/player-repository.js';
import { UpdateMyPlayerInput, UpdateMyPlayerOutput } from './update-my-player.dto.js';

export class PlayerNotFoundError extends Error {
  constructor() {
    super('Player not found');
    this.name = 'PlayerNotFoundError';
  }
}

export class InvalidPositionError extends Error {
  constructor(message = 'Invalid position slug') {
    super(message);
    this.name = 'InvalidPositionError';
  }
}

export class UpdateMyPlayerUseCase {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async execute(input: UpdateMyPlayerInput): Promise<UpdateMyPlayerOutput> {
    // Busca o player pelo userId
    const player = await this.playerRepository.findByUserId(input.userId);
    if (!player) {
      throw new PlayerNotFoundError();
    }

    // Prepara os dados para atualização (apenas os campos fornecidos)
    const updateData: {
      name?: string;
      positionSlug?: string | null;
      number?: number | null;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.positionSlug !== undefined) updateData.positionSlug = input.positionSlug;
    if (input.number !== undefined) updateData.number = input.number;

    try {
      // Atualiza o player
      const updated = await this.playerRepository.update(player.id, updateData);

      return {
        id: updated.id,
        name: updated.name,
        photo: updated.photo,
        positionSlug: updated.positionSlug,
        number: updated.number,
        isActive: updated.isActive,
        position: updated.position
          ? {
              slug: updated.position.slug,
              name: updated.position.name,
              description: updated.position.description,
            }
          : null,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || '';
      // Detecta violação de FK para positionSlug inválida
      if (
        errorMessage.toLowerCase().includes('foreign key') ||
        errorMessage.toLowerCase().includes('relation')
      ) {
        throw new InvalidPositionError();
      }
      throw error;
    }
  }
}
