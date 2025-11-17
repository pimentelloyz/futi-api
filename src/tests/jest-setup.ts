import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup global para testes E2E com Jest
beforeAll(async () => {
  console.log('🚀 Iniciando testes E2E RBAC...');
  await prisma.$connect();
});

afterAll(async () => {
  console.log('✅ Finalizando testes E2E RBAC...');
  await prisma.$disconnect();
});

// Timeout global para testes E2E
jest.setTimeout(30000);

// Export prisma para uso nos testes
export { prisma };
