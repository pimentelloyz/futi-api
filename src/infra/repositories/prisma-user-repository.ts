import { prisma } from '../prisma/client.js';

export interface UpsertUserInput {
  firebaseUid: string;
  email?: string | null;
  displayName?: string | null;
}

export class PrismaUserRepository {
  async upsertByFirebase(data: UpsertUserInput) {
    const user = await prisma.user.upsert({
      where: { firebaseUid: data.firebaseUid },
      create: {
        firebaseUid: data.firebaseUid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
      },
      update: {
        email: data.email ?? null,
        displayName: data.displayName ?? null,
      },
      select: { id: true, firebaseUid: true, email: true, displayName: true },
    });
    return user;
  }
}
