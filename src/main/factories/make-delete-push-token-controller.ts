import { PrismaClient } from '@prisma/client';

import {
  DeletePushTokenController,
  DeleteAllPushTokensController,
} from '../../presentation/controllers/delete-push-token-controller.js';

const prisma = new PrismaClient();

export function makeDeletePushTokenController() {
  return new DeletePushTokenController(prisma);
}

export function makeDeleteAllPushTokensController() {
  return new DeleteAllPushTokensController(prisma);
}
