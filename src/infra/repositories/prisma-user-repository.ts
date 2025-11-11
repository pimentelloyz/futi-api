import { prisma } from '../prisma/client.js';

export interface UpsertUserInput {
  firebaseUid: string;
  email?: string | null;
  displayName?: string | null;
}

export class PrismaUserRepository {
  async upsertByFirebase(data: UpsertUserInput) {
    // Se tivermos email, preferimos reconciliar pelo email para evitar violar unique(User_email_key)
    if (data.email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingByEmail) {
        // Se o usuário já existe por email, garantir que o firebaseUid seja o atual e atualizar campos
        const updated = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            firebaseUid: data.firebaseUid,
            // manter email consistente (já é único)
            email: data.email ?? null,
            displayName: data.displayName ?? null,
          },
          select: { id: true, firebaseUid: true, email: true, displayName: true },
        });
        return updated;
      }
    }

    // Caso não exista por email (ou não foi fornecido), fazemos upsert pelo firebaseUid
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
