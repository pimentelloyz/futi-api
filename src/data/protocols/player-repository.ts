import { AddPlayerInput } from '../../domain/usecases/add-player.js';

export interface PlayerRepository {
  add(data: AddPlayerInput): Promise<{ id: string }>;
  addForUser(userId: string, data: AddPlayerInput): Promise<{ id: string }>;
  findByUserId(userId: string): Promise<{
    id: string;
    name: string;
    positionSlug?: string | null;
    position?: { slug: string; name: string; description?: string | null } | null;
    number?: number | null;
    isActive: boolean;
  } | null>;
}
