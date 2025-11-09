import { EnsureUser, EnsureUserInput } from '../../domain/usecases/ensure-user.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';

export class DbEnsureUser implements EnsureUser {
  constructor(private readonly userRepo: PrismaUserRepository) {}

  async ensure(input: EnsureUserInput): Promise<{ id: string; firebaseUid: string }> {
    const user = await this.userRepo.upsertByFirebase(input);
    return { id: user.id, firebaseUid: user.firebaseUid };
  }
}
