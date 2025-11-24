import { PrismaClient } from '@prisma/client';

import {
  SubscribeToTopicController,
  UnsubscribeFromTopicController,
  SendToTopicController,
} from '../../presentation/controllers/topics-controller.js';

const prisma = new PrismaClient();

export function makeSubscribeToTopicController() {
  return new SubscribeToTopicController(prisma);
}

export function makeUnsubscribeFromTopicController() {
  return new UnsubscribeFromTopicController(prisma);
}

export function makeSendToTopicController() {
  return new SendToTopicController(prisma);
}
