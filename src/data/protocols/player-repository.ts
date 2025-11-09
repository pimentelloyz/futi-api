import { AddPlayerInput } from '../../domain/usecases/add-player.js';

export interface PlayerRepository {
  add(data: AddPlayerInput): Promise<{ id: string }>;
}
